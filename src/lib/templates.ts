export interface PosterTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Optional base64 data URL of a PNG/JPG uploaded by admin. When present it overrides the gradient. */
  backgroundImage?: string;
  backgroundGradient: {
    from: string;
    via?: string;
    to: string;
  };
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
    borderColor: string;
    borderWidth: number;
    shadowColor: string;
    shadowBlur: number;
  };
  badge: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    fillColor: string;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
  };
  textElements: {
    type: 'name' | 'slogan' | 'logo-text' | 'id-tag';
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontWeight: string;
    fontFamily: string;
    textColor: string;
    align: 'left' | 'center' | 'right';
    shadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
  }[];
  shapes: {
    type: 'circle' | 'rect' | 'triangle' | 'ring';
    x: number;
    y: number;
    size: number;
    width?: number;
    height?: number;
    fillColor: string;
    opacity: number;
    rotation?: number;
  }[];
}

export const CAMPAIGN_TEMPLATES: PosterTemplate[] = [
  {
    id: 'cyber-student-2026',
    name: 'Finally Made It Success Story',
    width: 1080,
    height: 1920,
    backgroundImage: '/finally-made-it.jpg',
    backgroundGradient: {
      from: '#090826',
      via: '#110c3b',
      to: '#180f4a',
    },
    frame: {
      x: 170,
      y: 480,
      width: 740,
      height: 740,
      borderRadius: 370,
      borderColor: 'transparent',
      borderWidth: 0,
      shadowColor: 'transparent',
      shadowBlur: 0,
    },
    badge: {
      text: '',
      x: 540,
      y: 1680,
      fontSize: 24,
      fontFamily: 'Outfit, sans-serif',
      textColor: '#ffffff',
      fillColor: '#6366f1',
      borderRadius: 16,
      paddingX: 30,
      paddingY: 12,
    },
    textElements: [
      {
        type: 'name',
        text: '{NAME}',
        x: 540,
        y: 1320,
        fontSize: 84,
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#ffffff',
        align: 'center',
      }
    ],
    shapes: []
  },
  {
    id: 'winner-2026',
    name: 'Winner',
    width: 1080,
    height: 1920,
    backgroundGradient: {
      from: '#064e3b', // Deep Forest Green
      via: '#022c22',  // Very dark teal
      to: '#0284c7',   // Ocean Blue splash
    },
    frame: {
      x: 162,
      y: 630,
      width: 756,
      height: 670,
      borderRadius: 80,
      borderColor: '#ffffff',
      borderWidth: 0,
      shadowColor: 'transparent',
      shadowBlur: 0,
    },
    badge: {
      text: 'LEAD THE FUTURE',
      x: 540,
      y: 330,
      fontSize: 24,
      fontFamily: 'Outfit, sans-serif',
      textColor: '#064e3b',
      fillColor: '#10b981',
      borderRadius: 16,
      paddingX: 30,
      paddingY: 12,
    },
    textElements: [
      {
        type: 'logo-text',
        text: '♣ GREEN INITIATIVE ♣',
        x: 540,
        y: 120,
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#10b981',
        align: 'center',
      },
      {
        type: 'slogan',
        text: 'GROWTH. UNITY. PROGRESS.',
        x: 540,
        y: 1390,
        fontSize: 48,
        fontWeight: '900',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#34d399',
        align: 'center',
        shadow: {
          color: 'rgba(52, 211, 153, 0.4)',
          blur: 15,
          offsetX: 0,
          offsetY: 0,
        }
      },
      {
        type: 'name',
        text: '{NAME}',
        x: 540,
        y: 1500,
        fontSize: 76,
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#ffffff',
        align: 'center',
      },
      {
        type: 'slogan',
        text: 'ACADEMIC EXCELLENCE & SUSTAINABILITY',
        x: 540,
        y: 1620,
        fontSize: 30,
        fontWeight: '500',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#a7f3d0',
        align: 'center',
      },
    ],
    shapes: [
      { type: 'circle', x: 950, y: 180, size: 300, fillColor: '#059669', opacity: 0.2 },
      { type: 'circle', x: 100, y: 1700, size: 250, fillColor: '#38bdf8', opacity: 0.15 },
      { type: 'ring', x: 540, y: 960, size: 900, fillColor: '#10b981', opacity: 0.05 },
      { type: 'rect', x: 80, y: 1320, size: 120, width: 920, height: 6, fillColor: '#10b981', opacity: 0.3 },
    ]
  },
  {
    id: 'gold-academic-2026',
    name: 'Classic Gold & Navy',
    width: 1080,
    height: 1920,
    backgroundGradient: {
      from: '#0b132b', // Deep Navy
      via: '#1c2541',  // Slate Blue
      to: '#0b132b',   // Navy
    },
    frame: {
      x: 140,
      y: 400,
      width: 800,
      height: 900,
      borderRadius: 16, // Square frame with slight corner rounding
      borderColor: '#fbbf24', // Gold border
      borderWidth: 10,
      shadowColor: 'rgba(251, 191, 36, 0.4)',
      shadowBlur: 35,
    },
    badge: {
      text: 'ACADEMIC HONOR SOCIETY',
      x: 540,
      y: 330,
      fontSize: 24,
      fontFamily: 'Outfit, sans-serif',
      textColor: '#0b132b',
      fillColor: '#fbbf24',
      borderRadius: 4,
      paddingX: 30,
      paddingY: 12,
    },
    textElements: [
      {
        type: 'logo-text',
        text: '♛ STUDENT SENATE ♛',
        x: 540,
        y: 120,
        fontSize: 34,
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#fbbf24',
        align: 'center',
      },
      {
        type: 'slogan',
        text: 'HONOR. INTEGRITY. ACHIEVEMENT.',
        x: 540,
        y: 1390,
        fontSize: 48,
        fontWeight: '900',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#fbbf24',
        align: 'center',
        shadow: {
          color: 'rgba(251, 191, 36, 0.4)',
          blur: 15,
          offsetX: 0,
          offsetY: 0,
        }
      },
      {
        type: 'name',
        text: '{NAME}',
        x: 540,
        y: 1500,
        fontSize: 76,
        fontWeight: 'bold',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#ffffff',
        align: 'center',
      },
      {
        type: 'slogan',
        text: 'YOUR REPRESENTATIVE FOR 2026',
        x: 540,
        y: 1620,
        fontSize: 32,
        fontWeight: '500',
        fontFamily: 'Outfit, sans-serif',
        textColor: '#94a3b8',
        align: 'center',
      },
    ],
    shapes: [
      { type: 'circle', x: 100, y: 150, size: 200, fillColor: '#fbbf24', opacity: 0.1 },
      { type: 'circle', x: 980, y: 1700, size: 300, fillColor: '#1e293b', opacity: 0.3 },
      { type: 'rect', x: 80, y: 1320, size: 120, width: 920, height: 6, fillColor: '#fbbf24', opacity: 0.3 },
    ]
  }
];

export const getCampaignTemplates = async (): Promise<PosterTemplate[]> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mkc_custom_templates');
      if (stored) {
        const customTemplates: PosterTemplate[] = JSON.parse(stored);
        return [...CAMPAIGN_TEMPLATES, ...customTemplates];
      }
    } catch (err) {
      console.error('Failed to load custom templates from local storage', err);
    }
  }
  return CAMPAIGN_TEMPLATES;
};
