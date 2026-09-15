import React from 'react';

interface YellowRibbonProps {
  className?: string;
  size?: number;
}

/**
 * Fitilho do Setembro Amarelo (Yellow September Awareness Ribbon)
 * Utiliza diretamente a imagem da fita de cetim amarela enviada pelo usuário,
 * sem recortes ou alterações na sua forma original.
 */
export const YellowRibbon: React.FC<YellowRibbonProps> = ({
  className = 'w-14 h-7 sm:w-20 sm:h-10',
  size,
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative shrink-0 select-none ${className}`}
      title="Setembro Amarelo • A vida é a melhor escolha 🎗️"
      aria-label="Fitilho do Setembro Amarelo"
    >
      <img
        src="/assets/fitilho-setembro-amarelo-trimmed.png"
        alt="Fitilho Setembro Amarelo"
        className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
        style={size ? { width: size, height: 'auto' } : undefined}
        referrerPolicy="no-referrer"
      />
    </span>
  );
};
