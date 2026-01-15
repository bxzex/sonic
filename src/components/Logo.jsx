import React from 'react';

const Logo = ({ size = 32, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Outer Rings */}
            <circle
                cx="50" cy="50" r="45"
                stroke="url(#brand-grad)"
                strokeWidth="1.5"
                strokeOpacity="0.3"
            />

            {/* Ionic Orbitals */}
            <ellipse
                cx="50" cy="50" rx="40" ry="15"
                stroke="url(#brand-grad)"
                strokeWidth="2"
                transform="rotate(45 50 50)"
                opacity="0.8"
            />
            <ellipse
                cx="50" cy="50" rx="40" ry="15"
                stroke="url(#brand-grad)"
                strokeWidth="2"
                transform="rotate(-45 50 50)"
                opacity="0.6"
            />

            {/* Central Star */}
            <path
                d="M50 20L54 42L76 46L54 50L58 72L50 54L42 72L46 50L24 46L46 42L50 20Z"
                fill="url(#brand-grad)"
                filter="url(#glow)"
            />

            {/* Core Glow */}
            <circle cx="50" cy="46" r="4" fill="white" filter="url(#glow)" opacity="0.9" />
        </svg>
    );
};

export default Logo;
