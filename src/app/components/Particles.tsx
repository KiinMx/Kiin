import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim"; // Carga el paquete ligero
import { useEffect, useMemo, useState } from "react";
// Container,
import { ISourceOptions, MoveDirection, OutMode } from "@tsparticles/engine";
import React from "react";

const ParticlesBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine); // Carga solo las funcionalidades necesarias
    }).then(() => setInit(true));
  }, []);


  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: { value: "#FFFFF" },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { enable: true, mode: "repulse" },
        },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 100, duration: 0.4 },
        },
      },
      particles: {
        color: { value: "#9333ea" },
        links: {
          color: "#9333ea",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: { default: OutMode.out },
          speed: 2,
        },
        number: {
          density: { enable: true },
          value: 80,
        },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 5 } },
      },
      detectRetina: true,
    }),
    []
  );

  // Renderizar partículas si ya está inicializado
  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        className="absolute inset-0"
      />
    );
  }

  return null;
};

// Usar React.memo para evitar re-renders innecesarios
const MemoizedParticlesBackground = React.memo(ParticlesBackground);

export default MemoizedParticlesBackground;
