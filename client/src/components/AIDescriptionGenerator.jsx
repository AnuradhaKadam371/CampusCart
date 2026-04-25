import React, { useState } from 'react';
import api from '../utils/api';
import './AIDescriptionGenerator.css';

const AIDescriptionGenerator = ({ images, onGeneratedDescription }) => {
  const [loading, setLoading] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);

  const generateDescription = async () => {
    if (!images || images.length === 0) {
      alert('Please upload at least one image first');
      return;
    }

    setLoading(true);
    setShowSuggestion(false);

    try {
      const file = images[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result;

          const response = await api.post('/products/generate-description',
            { imageUrl: base64Data },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { description, category } = response.data;

          setGeneratedDesc(description);
          setSuggestedCategory(category);
          setShowSuggestion(true);

          onGeneratedDescription({ description, category });
        } catch (err) {
          console.error('Generation error:', err);
          alert(err.response?.data?.msg || 'Could not generate description. Please write manually.');
          setGeneratedDesc('');
          setSuggestedCategory('');
          setShowSuggestion(false);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const acceptSuggestion = () => {
    onGeneratedDescription({
      description: generatedDesc,
      category: suggestedCategory
    });
    setShowSuggestion(false);
  };

  const rejectSuggestion = () => {
    setGeneratedDesc('');
    setSuggestedCategory('');
    setShowSuggestion(false);
  };

  return (
    <div className="ai-gen-container">
      <div className="ai-gen-header">
        <div className="ai-gen-icon">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div>
          <h4 className="ai-gen-title">AI-Powered Description</h4>
          <p className="ai-gen-subtitle">
            Let AI analyze your photo and write a description automatically
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={generateDescription}
        disabled={loading || !images || images.length === 0}
        className={`ai-gen-btn ${loading ? 'ai-gen-btn-loading' : ''}`}
      >
        {loading ? (
          <>
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Analyzing image…</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Generate with AI</span>
          </>
        )}
      </button>

      {showSuggestion && (
        <div className="ai-suggestion-card">
          <p className="ai-suggestion-label">✨ AI Suggestion</p>

          <div className="ai-suggestion-field">
            <span className="ai-suggestion-field-label">Description</span>
            <p className="ai-suggestion-text">"{generatedDesc}"</p>
          </div>

          <div className="ai-suggestion-field">
            <span className="ai-suggestion-field-label">Category</span>
            <span className="ai-suggestion-category-badge">{suggestedCategory}</span>
          </div>

          <div className="ai-suggestion-actions">
            <button type="button" onClick={acceptSuggestion} className="ai-btn-accept">
              <i className="fa-solid fa-check"></i> Use Suggestion
            </button>
            <button type="button" onClick={rejectSuggestion} className="ai-btn-reject">
              <i className="fa-solid fa-xmark"></i> Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDescriptionGenerator;
