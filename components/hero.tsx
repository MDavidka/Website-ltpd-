'use client'

import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Hero main section */}
      <div className="relative min-h-[580px]">
        {/* Background with metallic texture - diagonal clip from top-right to bottom-left */}
        <div 
          className="absolute inset-0"
          style={{
            clipPath: 'polygon(0 0, 48% 0, 38% 100%, 0 100%)',
          }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://github.com/user-attachments/assets/355037c1-5d4d-4de5-894d-ee1f79389afa)',
            }}
          />
          {/* Subtle dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left content */}
            <div className="space-y-5 pt-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                {/* Sycord logo - envelope/mail icon style */}
                <svg 
                  width="36" 
                  height="28" 
                  viewBox="0 0 36 28" 
                  fill="none"
                >
                  <path 
                    d="M2 6C2 3.79086 3.79086 2 6 2H30C32.2091 2 34 3.79086 34 6V22C34 24.2091 32.2091 26 30 26H6C3.79086 26 2 24.2091 2 22V6Z" 
                    fill="#6b7280"
                  />
                  <path 
                    d="M6 8L18 16L30 8" 
                    stroke="#0a0a0a" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[22px] font-bold text-white tracking-tight">sycord</span>
              </div>

              {/* Tagline */}
              <h1 className="text-xl md:text-[22px] leading-relaxed">
                <span className="text-gray-400">ship your website </span>
                <span className="text-white font-bold">under 5 minutes</span>
              </h1>

              {/* Social icons */}
              <div className="flex items-center gap-5 pt-1">
                {/* GitHub */}
                <div className="flex items-center gap-2 text-gray-500 opacity-60">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </div>
                {/* Google */}
                <div className="flex items-center text-gray-500 opacity-60">
                  <span className="text-sm font-medium tracking-tight">Google</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-3">
                <button className="w-44 py-3 bg-[#4a4a4a]/60 hover:bg-[#4a4a4a]/80 text-gray-400 rounded-full text-sm font-medium transition-colors">
                  &nbsp;
                </button>
              </div>
            </div>

            {/* Right illustration */}
            <div className="relative flex justify-center lg:justify-end items-start pt-0 lg:-mt-4">
              <div className="relative w-full max-w-[420px]">
                <Image
                  src="https://github.com/user-attachments/assets/98919252-a9b2-4366-9a32-68484586dabb"
                  alt="Blueprint illustration"
                  width={500}
                  height={450}
                  className="w-full h-auto object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards section */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 lg:px-12 pb-20 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="aspect-[1/1.1] rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#333] transition-colors"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
