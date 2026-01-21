import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
  imageSrc?: string;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-24 w-24',
};

const textSizeMap = {
  sm: {
    title: 'text-sm',
    subtitle: 'text-[10px]',
  },
  md: {
    title: 'text-lg',
    subtitle: 'text-xs',
  },
  lg: {
    title: 'text-2xl',
    subtitle: 'text-sm',
  },
};

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
  textPosition = 'right',
  imageSrc = '/image.png', // DEFAULT PUBLIC LOGO
}) => {
  // IMAGE ONLY
  if (!showText) {
    return (
      <img
        src={imageSrc}
        alt="Circular Nest Logo"
        className={`${sizeMap[size]} object-contain ${className}`}
      />
    );
  }

  // IMAGE + TEXT (BOTTOM)
  if (textPosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <img
          src={imageSrc}
          alt="Circular Nest Logo"
          className={`${sizeMap[size]} object-contain`}
        />

        <div className="text-center">
          <h1
            className={`${textSizeMap[size].title} font-bold tracking-tight text-foreground`}
          >
            Circular <span className="text-primary">Nest</span>
          </h1>
          <p
            className={`${textSizeMap[size].subtitle} text-muted-foreground`}
          >
            Education Circular Archive
          </p>
        </div>
      </div>
    );
  }

  // IMAGE + TEXT (RIGHT)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={imageSrc}
        alt="Circular Nest Logo"
        className={`${sizeMap[size]} object-contain`}
      />

      <div className="flex flex-col">
        <h1
          className={`${textSizeMap[size].title} font-bold tracking-tight leading-tight text-foreground`}
        >
          Circular <span className="text-primary">Nest</span>
        </h1>
        <p
          className={`${textSizeMap[size].subtitle} text-muted-foreground leading-tight`}
        >
          Education Circular Archive
        </p>
      </div>
    </div>
  );
};

export default Logo;
