
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import type { ImageAnalysis } from '../types';
import { Card, CardHeader } from './Card';
import { Loader } from './Loader';
import { ImageIcon } from './icons/ImageIcon';

const InspirationAnalyzer: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000 * 1024 * 1024) { // 1000MB limit
          setError('Image size should not exceed 1000MB.');
          return;
      }
      setError(null);
      setImageFile(file);
      setAnalysis(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
        setPreviewUrl(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      setError('Please select an image to analyze.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      if (imageFile) {
        const result = await analyzeImage(imageBase64, imageFile.type);
        setAnalysis(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const AnalysisSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => 
            <li key={index} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-3 py-1 rounded-full">{item}</li>
        )}
      </ul>
    </div>
  );

  return (
    <Card>
       <CardHeader 
        title="Inspiration Analyzer"
        description="Upload an image of a building or interior to identify its style, features, and palette."
        icon={<ImageIcon />}
      />

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <label htmlFor="image-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Upload Image (Max 1000MB)
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            disabled={loading}
          />
          {previewUrl && (
            <div className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-2">
              <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-contain rounded" />
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading || !imageBase64}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>

        <div className="min-h-[200px]">
          {loading && <Loader text="Analyzing image with Gemini Flash..."/>}
          {analysis && (
            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Architectural Style</h3>
                <p className="text-primary-600 dark:text-primary-300 font-bold text-xl">{analysis.architecturalStyle}</p>
              </div>
               <AnalysisSection title="Key Features" items={analysis.keyFeatures} />
               <AnalysisSection title="Color Palette" items={analysis.colorPalette} />
               <AnalysisSection title="Potential Materials" items={analysis.potentialMaterials} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InspirationAnalyzer;
