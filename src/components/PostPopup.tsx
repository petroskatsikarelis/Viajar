'use client';

import { useEffect } from 'react';

type PostPopupProps = {
  post: {
    id: string;
    title: string;
    description: string | null;
    category_slug: string;
  } | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
};

export default function PostPopup({ post, position, onClose }: PostPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!post || !position) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 14px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            maxWidth: '280px',
            minWidth: '200px',
            position: 'relative',
            marginBottom: '8px',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
          >
            ✕
          </button>

          {/* Content */}
          <div style={{ paddingRight: '24px' }}>
            <strong
              style={{
                color: '#000000',
                fontSize: '13px',
                display: 'block',
                marginBottom: '4px',
                fontWeight: 700,
                lineHeight: 1.2,
                wordWrap: 'break-word',
              }}
            >
              {post.title}
            </strong>
            {post.description && (
              <span
                style={{
                  color: '#555555',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '4px',
                  lineHeight: 1.4,
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {post.description}
              </span>
            )}
            <em
              style={{
                color: '#20B2AA',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {post.category_slug}
            </em>
          </div>

          {/* Arrow pointer */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #ffffff',
            }}
          />
        </div>
      </div>
    </>
  );
}
