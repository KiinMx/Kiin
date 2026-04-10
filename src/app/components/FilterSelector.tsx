"use client"
import CategorySelector from '@/app/components/CategorySelector';
import Category from '@/domain/entities/Category';
import DegreeCategory from '@/domain/entities/DegreeCategory';
import SubjectCategory from '@/domain/entities/SubjectCategory';
import React from 'react';


interface FilterSelectorProps {
    categories: Category[]
    onClick: (newCategories: Category[]) => void

}


const FilterSelector: React.FC<FilterSelectorProps> = ({ categories, onClick }) => {
    const degreeCategory = categories.find(c => c instanceof DegreeCategory) as DegreeCategory | undefined;
    const selectedDegrees = degreeCategory?.selectedValues || [];
    
    const isDegreeSelected = selectedDegrees.length > 0;
    const degreeTitle = isDegreeSelected ? selectedDegrees[0].name : "";

    const refreshCategories = (categoryIndex: number, valueId: number) => {
        const newCategories = [...categories];
        const category = newCategories[categoryIndex]
        category.onClick(valueId);
        newCategories[categoryIndex] = category;
        categories.forEach((cat) => cat.filterWithCategories(newCategories));
        onClick(newCategories);
    }

    return (
        <div className="flex-1 overflow-y-auto p-1 h-full pb-32">
            <div className='font-bold mb-4 p-1.5'>Selecciona tu Carrera</div>
            <ul className="space-y-2 ">
                {
                    categories.filter(c => c instanceof DegreeCategory).map((category, index) => (
                        <CategorySelector 
                            key={index} 
                            category={category} 
                            onClick={(valueId) => refreshCategories(categories.indexOf(category), valueId)}
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
                        <CategorySelector key={category.title} category={category} onClick={(valueId) => refreshCategories(categories.indexOf(category), valueId)} />
                    ))
                }
            </ul> : <span className='text-gray-500'>
                Selecciona tu Plan de Estudios primero
            </span>}

        </div>
    )
}

export default FilterSelector