import Category from "@/domain/entities/Category";

import { Subject } from "@/domain/entities/Subject";
import React, { useState } from "react";

interface CategoryProps {
    category: Category;
    onClick: (valueId: number) => void;
    isDegreeSelected: boolean

    isDegreeCategory?: boolean;
    degreeTitle?: string;
}

const DropdownIcon = () => {
    return (
        <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
            />
        </svg>
    );
};

const ValueCell: React.FC<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
    disabled: boolean;
    subjectType?: string;
}> = ({ label, isSelected, onClick, disabled, subjectType }) => {
    return (
        <div className="flex ">
            <button
                onClick={onClick}
                disabled={disabled}
                className={` md:hover:text-white ${disabled ? "text-gray-500 hover:bg-transparent" : "md:hover:bg-gray-700"} overflow-hidden flex-1 flex-col items-center  p-2 mx-4 text-left transition duration-75 rounded-lg  group md:hover:bg-blue-300  ${isSelected ? 'dark:hover:bg-black bg-black text-white' : ''}`}
            >
                <div className={`${subjectType === "Obligatoria" ? "text-blue-500" : "text-green-500"} text-start`}> {subjectType}</div>


                {label}
            </button>
        </div>
    );
};

const CategorySelector: React.FC<CategoryProps> = ({ category, onClick, isDegreeCategory = false, degreeTitle }) => {
    const [isVisible, setIsVisible] = useState(false);


    return (
        <li className="border-1 rounded-lg border-gray-500">
            <button
                aria-controls="dropdown-example"
                onClick={() => setIsVisible(!isVisible)}
                className={`bg-gray-300 dark:border-none border-b border-gray-500  dark:bg-gray-900  sticky top-0 flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group md:hover:bg-gray-100 dark:text-white md:dark:hover:bg-gray-700  `}
            >
                <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">
                    {isDegreeCategory && degreeTitle ? degreeTitle : category.title}
                </span>
                <DropdownIcon />
            </button>

            <ul className={`${isVisible ? "block" : "hidden"} py-2 space-y-2 `}>
                {category.values.map((value) => (
                    <ValueCell
                        key={value.id}
                        label={value.label}
                        subjectType={(value.value as Subject).type}
                        isSelected={category.isSelected(value.id)}
                        onClick={() => {
                            onClick(value.id)
                            if (isDegreeCategory) {
                                setIsVisible(false);
                            }
                        }}
                        disabled={false}
                    />
                ))}
            </ul>
        </li>
    );
};

export default CategorySelector;
