'use client'
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import ParticlesContainer from './components/ParticlesContainer';
const HomeContent: React.FC = () => {
  const words = useMemo(() => ['Inteligente', 'Eficiente', 'Rápida', 'Fácil', 'Visual'], []);
  const colors = useMemo(() => [
    'text-blue-500',
    'text-green-500',
    'text-purple-500',
    'text-pink-500',
    'text-yellow-500',
    'text-indigo-500',
    'text-red-500'
  ], []);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeoutId: NodeJS.Timeout;

    setDisplayText('');

    // Typing animation
    const typeText = (index: number) => {
      if (index <= currentWord.length) {
        setDisplayText(currentWord.slice(0, index));
        if (index < currentWord.length) {
          timeoutId = setTimeout(() => typeText(index + 1), 150);
        } else {
          // Wait before starting to delete
          timeoutId = setTimeout(() => {
            deleteText(currentWord.length);
          }, 2000);
        }
      }
    };

    // Deleting animation
    const deleteText = (index: number) => {
      if (index >= 0) {
        setDisplayText(currentWord.slice(0, index));
        if (index > 0) {
          timeoutId = setTimeout(() => deleteText(index - 1), 75);
        } else {
          // Move to next word after a short delay
          timeoutId = setTimeout(() => {
            setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
          }, 500);
        }
      }
    };

    // Start typing after a short delay
    timeoutId = setTimeout(() => typeText(0), 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentWordIndex, words]);

  return (
    <div className=' h-full overflow-auto flex-col'>
      <ParticlesContainer />
      <div className=" relative  h-full">
        <div className="container mx-auto flex h-full flex-col-reverse lg:flex-row items-center justify-center  gap-6 px-4">
          <div className="max-w-2xl text-center lg:text-left flex flex-col gap-10 items-center lg:items-start justify-center">
            <h1 className="text-5xl text-wrap sm:text-5xl lg:text-7xl leading-tight flex flex-col items-center sm:items-start">
              Planea tu Carga Académica de forma
              <span
                className={`
                ${colors[currentWordIndex]} 
                typewriter-text
                font-bold
                w-max
                border
              
              `}

              >
                {displayText}
                <span className="typewriter-cursor">
                  |
                </span>
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl">
              De estudiantes para estudiantes
            </p>
            <div className="flex flex-col items-center lg:items-start gap-3">
              <span className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Selecciona tu facultad
              </span>
              <div className="flex flex-row gap-4">
                <Link href={'/generador/matematicas'}>
                  <button className="py-3 px-8 bg-purple-500 hover:bg-purple-700 text-white font-bold rounded-xl transform transition-transform duration-150 active:scale-110">
                    Matemáticas
                  </button>
                </Link>
                <Link href={'/generador/psicologia'}>
                  <button className="py-3 px-8 bg-indigo-500 hover:bg-indigo-700 text-white font-bold rounded-xl transform transition-transform duration-150 active:scale-110">
                    Psicología
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className="mx-16 flex justify-center lg:justify-start mt-6 lg:mx-0 xl:mx-0 2xl:mx-9">
            <Image
              className="max-w-full h-auto sm:h-80 sm:w-auto lg:h-5/6 lg:w-auto object-cover"
              src="/img/banner.png"
              alt="Img bienvenida kiin"
              width={500}
              height={500}
            />
          </div>
        </div>
      </div>
    </div>

  );
}

export default HomeContent