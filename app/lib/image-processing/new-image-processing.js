import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, Download, Settings, Play } from 'lucide-react';

const CIImagePreprocessor = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    contrast: 1.5,
    brightness: 1.2,
    gamma: 0.8,
    sharpen: true,
    denoise: true,
    dpi: 300,
    grayscale: true,
    threshold: 128,
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage({
            element: img,
            src: e.target.result,
            width: img.width,
            height: img.height,
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyGammaCorrection = (imageData, gamma) => {
    const data = imageData.data;
    const gammaCorrection = 1 / gamma;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 * Math.pow(data[i] / 255, gammaCorrection); // R
      data[i + 1] = 255 * Math.pow(data[i + 1] / 255, gammaCorrection); // G
      data[i + 2] = 255 * Math.pow(data[i + 2] / 255, gammaCorrection); // B
    }

    return imageData;
  };

  const applyConvolution = (imageData, kernel, kernelWeight = 1) => {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src);
    const width = imageData.width;
    const height = imageData.height;
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const srcY = y + ky - half;
            const srcX = x + kx - half;
            const srcOffset = (srcY * width + srcX) * 4;
            const kernelValue = kernel[ky * kernelSize + kx];

            r += src[srcOffset] * kernelValue;
            g += src[srcOffset + 1] * kernelValue;
            b += src[srcOffset + 2] * kernelValue;
          }
        }

        const dstOffset = (y * width + x) * 4;
        dst[dstOffset] = r / kernelWeight;
        dst[dstOffset + 1] = g / kernelWeight;
        dst[dstOffset + 2] = b / kernelWeight;
      }
    }

    return new ImageData(dst, width, height);
  };

  const sharpenImage = imageData => {
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    return applyConvolution(imageData, sharpenKernel);
  };

  const denoiseImage = imageData => {
    // Gaussian blur pentru reducerea zgomotului
    const gaussianKernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    return applyConvolution(imageData, gaussianKernel, 16);
  };

  const processImage = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Calculăm dimensiunile pentru DPI dorit
      const scaleFactor = settings.dpi / 72; // 72 DPI este standard web
      const newWidth = Math.floor(originalImage.width * scaleFactor);
      const newHeight = Math.floor(originalImage.height * scaleFactor);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Desenăm imaginea scalată
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(originalImage.element, 0, 0, newWidth, newWidth);

      // Obținem datele imaginii
      let imageData = ctx.getImageData(0, 0, newWidth, newHeight);
      const data = imageData.data;

      // 1. Conversie la grayscale dacă este selectată
      if (settings.grayscale) {
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray; // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
        }
      }

      // 2. Ajustarea contrastului și luminozității
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(
          255,
          Math.max(
            0,
            (data[i] - 128) * settings.contrast +
              128 +
              (settings.brightness - 1) * 50
          )
        );
        data[i + 1] = Math.min(
          255,
          Math.max(
            0,
            (data[i + 1] - 128) * settings.contrast +
              128 +
              (settings.brightness - 1) * 50
          )
        );
        data[i + 2] = Math.min(
          255,
          Math.max(
            0,
            (data[i + 2] - 128) * settings.contrast +
              128 +
              (settings.brightness - 1) * 50
          )
        );
      }

      // 3. Corecția gamma
      imageData = applyGammaCorrection(imageData, settings.gamma);

      // 4. Reducerea zgomotului
      if (settings.denoise) {
        imageData = denoiseImage(imageData);
      }

      // 5. Ascuțirea imaginii
      if (settings.sharpen) {
        imageData = sharpenImage(imageData);
      }

      // 6. Binarizare (threshold)
      if (settings.grayscale) {
        const finalData = imageData.data;
        for (let i = 0; i < finalData.length; i += 4) {
          const gray = finalData[i];
          const binary = gray > settings.threshold ? 255 : 0;
          finalData[i] = binary;
          finalData[i + 1] = binary;
          finalData[i + 2] = binary;
        }
      }

      // Aplicăm rezultatul final
      ctx.putImageData(imageData, 0, 0);

      // Salvăm imaginea procesată
      const processedDataUrl = canvas.toDataURL('image/png');
      setProcessedImage({
        src: processedDataUrl,
        width: newWidth,
        height: newHeight,
      });
    } catch (error) {
      console.error('Eroare la procesarea imaginii:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, settings]);

  const downloadProcessedImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.download = 'ci-processed.png';
    link.href = processedImage.src;
    link.click();
  };

  const resetSettings = () => {
    setSettings({
      contrast: 1.5,
      brightness: 1.2,
      gamma: 0.8,
      sharpen: true,
      denoise: true,
      dpi: 300,
      grayscale: true,
      threshold: 128,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileImage className="text-blue-600" />
          Pre-procesare CI pentru OCR
        </h1>

        {/* Upload Section */}
        <div className="mb-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">Încarcă imaginea CI (PNG, JPG)</p>
            <p className="text-sm text-gray-500">
              Click aici sau trage fișierul
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {originalImage && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={20} />
                    Setări Pre-procesare
                  </h3>
                  <button
                    onClick={resetSettings}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contrast: {settings.contrast.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={settings.contrast}
                      onChange={e =>
                        setSettings(s => ({
                          ...s,
                          contrast: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Luminozitate: {settings.brightness.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.brightness}
                      onChange={e =>
                        setSettings(s => ({
                          ...s,
                          brightness: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Gamma: {settings.gamma.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="2"
                      step="0.1"
                      value={settings.gamma}
                      onChange={e =>
                        setSettings(s => ({
                          ...s,
                          gamma: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      DPI: {settings.dpi}
                    </label>
                    <input
                      type="range"
                      min="150"
                      max="600"
                      step="50"
                      value={settings.dpi}
                      onChange={e =>
                        setSettings(s => ({
                          ...s,
                          dpi: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Threshold (Binarizare): {settings.threshold}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={settings.threshold}
                      onChange={e =>
                        setSettings(s => ({
                          ...s,
                          threshold: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.grayscale}
                        onChange={e =>
                          setSettings(s => ({
                            ...s,
                            grayscale: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Conversie la grayscale</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.sharpen}
                        onChange={e =>
                          setSettings(s => ({
                            ...s,
                            sharpen: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Ascuțire imagine</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.denoise}
                        onChange={e =>
                          setSettings(s => ({
                            ...s,
                            denoise: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Reducere zgomot</span>
                    </label>
                  </div>

                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Play size={16} />
                    )}
                    {isProcessing ? 'Procesez...' : 'Procesează Imaginea'}
                  </button>
                </div>
              </div>
            </div>

            {/* Images Display */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Imaginea Originală</h4>
                  <div className="border rounded-lg p-2 bg-white">
                    <img
                      src={originalImage.src}
                      alt="Original"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {originalImage.width} × {originalImage.height}px
                    </p>
                  </div>
                </div>

                {processedImage && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Imaginea Procesată</h4>
                      <button
                        onClick={downloadProcessedImage}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <div className="border rounded-lg p-2 bg-white">
                      <img
                        src={processedImage.src}
                        alt="Processed"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {processedImage.width} × {processedImage.height}px
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {processedImage && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Următorii pași pentru Tesseract:
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Folosește imaginea procesată cu Tesseract.js</p>
                    <p>
                      • Configurează PSM: tessedit_pageseg_mode: &apos;6&apos;
                      sau &apos;8&apos;
                    </p>
                    <p>• Setează limba: lang: &apos;ron&apos; (română)</p>
                    <p>
                      • Whitelist:
                      &apos;ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzăâîșțĂÂÎȘȚ0123456789&apos;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CIImagePreprocessor;
