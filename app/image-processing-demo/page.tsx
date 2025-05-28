import ImageProcessingDemo from '@/components/ImageProcessingDemo';

export default function ImageProcessingDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ImageProcessingDemo />
    </div>
  );
}

export const metadata = {
  title: 'Image Processing Pipeline Demo',
  description:
    'Comprehensive image preprocessing for Romanian ID document processing with Qwen2.5-VL-7B-Instruct',
};
