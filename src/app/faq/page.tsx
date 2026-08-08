"use client";

import React, { useState } from "react";

const FaqPage = () => {
  const faqs = [
    {
      pregunta: "¿Qué es Kiin?",
      respuesta:
        "Una herramienta que te permite encontrar todas las posibilidades de carga académica que tienes a tu alcance, tomando en cuenta múltiples restricciones.",
    },
    {
      pregunta: "¿Los horarios se encuentran actualizados?",
      respuesta:
        "Nuestro equipo de trabajo se encuentra pendiente de cualquier cambio en los horarios, por lo que puedes estar seguro que la informacion se encuentra actualizada",
    },
    {
      pregunta: "¿Es gratis?",
      respuesta: "Por supuesto, nuestra misión es ayudarlos...",
    },
    {
      pregunta: "¿Para quiénes está dirigido actualmente?",
      respuesta:
        "Nuestro público objetivo son los estudiantes de la Facultad de Matemáticas pertenecientes a la Universidad Autónoma de Yucatán (Mérida, Yucatán, México).",
    },
    {
      pregunta: "¿Tienen planes de expandirse a otras facultades de la UADY?",
      respuesta:
        "Es uno de nuestros objetivos a mediano plazo, pero, por el momento, estamos enfocados en la Facultad de Matemáticas.",
    },
    {
      pregunta: "¿Tienen planes de expandirse a otras Universidades?",
      respuesta:
        "Es uno de nuestros sueños dorados; sin embargo, no es algo que esté en nuestros planes a corto o mediano plazo.",
    },
    {
      pregunta: "¿Habrá nuevas mejoras?",
      respuesta: "Por supuesto que sí, solo les pedimos un poco de paciencia.",
    },

    {
      pregunta: "¿Qué significa fijar una materia?",
      respuesta:
        "Kiin genera todas las posibles combinaciones de materias y profesores, eso incluye horarios que pueden no incluir todas las materias que necesitas. Fijar una materia significa que Kiin generará combinaciones que incluyan esa materia específica, lo que te permitirá ver todas las opciones disponibles con esa materia incluida.",
    },
    {
      pregunta: "¿Qué significa fijar un profesor?",
      respuesta:
        "Fijar un profesor significa que Kiin generará combinaciones de horarios que incluyan ese profesor específico para la materia seleccionada. Esto te permite ver todas las opciones disponibles con ese profesor en particular.",
    },
    {
      pregunta: "¿Cómo podemos apoyarlos?",
      respuesta:
        "Comparte en redes sociales para que todos los estudiantes se enteren. Si quieres involucrarte más en el desarrollo visita el repositorio de GitHub en https://github.com/KiinMx/Kiin. O contáctate con Rodrigo Pacab",
    },
    {
      pregunta: "¿Dónde puedo obtener más información?",
      respuesta:
        "Puedes consultar nuestra página oficial en https://www.linkedin.com/company/kiinmx/ o el repositorio de GitHub en https://github.com/KiinMx/Kiin",
        
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className=" p-6 flex-1 overflow-auto">
      <h1 className="text-center text-4xl font-bold mb-6 mt-10">
        Preguntas Frecuentes (FAQ)
      </h1>
      <div className="max-w-2xl mx-auto mt-5">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-500 py-4">
            <button
              className="w-full text-left flex justify-between items-center text-2xl focus:outline-none dark:text-gray-500  "
              onClick={() => toggleFaq(index)}
            >
              {faq.pregunta}
              <span className="ml-2">{openIndex === index ? "-" : "+"}</span>
            </button>

            {openIndex === index && (
              <p className="mt-5 text-gray-800 text-base dark:text-gray-200">{faq.respuesta}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
