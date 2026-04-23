"use client"
import CategorySelector from '@/app/components/CategorySelector';
import ConfirmationModal from './ConfirmationModal';
import Category from '@/domain/entities/Category';
import DegreeCategory from '@/domain/entities/DegreeCategory';
import SubjectCategory from '@/domain/entities/SubjectCategory';
import React, { useState } from 'react';
interface FilterSelectorProps {
    categories: Category[]
    onClick: (newCategories: Category[]) => void

}


const FilterSelector: React.FC<FilterSelectorProps> = ({ categories, onClick }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [pendingSelection, setPendingSelection] = useState<{idx: number, id: number} | null>(null);
    const refreshCategories = (categoryIndex: number, valueId: number) => {
        const newCategories = [...categories];
        const category = newCategories[categoryIndex]
        category.onClick(valueId);
        newCategories[categoryIndex] = category;
        categories.forEach((cat) => cat.filterWithCategories(newCategories));
        onClick(newCategories);
    }

    const [degreeTitle, setDegreeTitle] = useState<string>("");
    const isDegreeSelected = degreeTitle.length !== 0;

    // 2. Nueva función de ejecución (aislando la responsabilidad de actualización)
    const executeRefresh = (categoryIndex: number, valueId: number) => {
        const degreeCategory = categories[categoryIndex];
        refreshCategories(categoryIndex, valueId);

        if (degreeCategory.selectedValues.length === 0) {
            setDegreeTitle("");
        } else {
            const selectedValue = degreeCategory.values.find(v => v.id === valueId);
            if (selectedValue) setDegreeTitle(selectedValue.label);
        }
    };

    // 3. Modificación del manejador para interceptar el flujo
    const handleDegreeClick = (categoryIndex: number, valueId: number) => {
        // Si ya hay una carrera, pausamos y pedimos permiso (Patrón Command)
        if (isDegreeSelected) {
            setPendingSelection({ idx: categoryIndex, id: valueId });
            setShowAlert(true);
        } else {
            executeRefresh(categoryIndex, valueId);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-1 h-full pb-32">
            <div className='font-bold mb-4 p-1.5'>Selecciona tu Carrera</div>
            <ul className="space-y-2 ">
                {
                    categories.filter(c => c instanceof DegreeCategory).map((category, index) => (
                        <CategorySelector
                            isDegreeSelected={isDegreeSelected}

                            key={index}
                            category={category}
                            onClick={(valueId) => handleDegreeClick(index, valueId)}
                            isDegreeCategory={true}
                            degreeTitle={degreeTitle}
                        />
                    ))
                }
            </ul>
            <div className='font-bold my-4 p-1.5'>Selecciona tus Materias</div>

            {isDegreeSelected ? <ul className="space-y-2 ">
                {
                    categories.filter(c => c instanceof SubjectCategory).map((category, index) => (
                        <CategorySelector isDegreeSelected={isDegreeSelected} key={index + 1} category={category} onClick={(valueId) => refreshCategories(index + 1, valueId)} />
                    ))
                }
            </ul> : <span className='text-gray-500'>
                Selecciona tu Plan de Estudios primero
            </span>}

            // 4. Integración en el JSX (al final del return)
            {showAlert && (
                <ConfirmationModal 
                    title="¿Cambiar de carrera?"
                    message="Se perderán las materias que no pertenezcan a tu nueva carrera seleccionada."
                    onConfirm={() => {
                        if (pendingSelection) 
                            executeRefresh(pendingSelection.idx, pendingSelection.id);
                        setShowAlert(false);
                        setPendingSelection(null);
                    }}
                    onCancel={() => {
                        setShowAlert(false);
                        setPendingSelection(null);
                    }}
                />
            )}

        </div>
    )
}

export default FilterSelector