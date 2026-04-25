import FilterSelector from "@/app/components/FilterSelector";
import Category from "@/domain/entities/Category";
import { Degree } from "@/domain/entities/Degree";
import DegreeCategory from "@/domain/entities/DegreeCategory";

import '@testing-library/jest-dom';
import { fireEvent, render } from "@testing-library/react";

jest.mock("@/app/components/ConfirmationModal", () => {
    const Mock = (props: { onConfirm: () => void; onCancel: () => void }) => {
        return (
            <div>
                <button data-testid="confirm" onClick={props.onConfirm}>
                    confirm
                </button>
                <button data-testid="cancel" onClick={props.onCancel}>
                    cancel
                </button>
            </div>
        );
    };
    Mock.displayName = 'MockConfirmationModal';
    return Mock;
});

describe("FilterSelector.handleDegreeClick", () => {
    const degrees: Degree[] = [new Degree(0, "ABC"), new Degree(1, "XYZ")];
    const categories: Category[] = [new DegreeCategory("Carrera", degrees)];
    let onClick: jest.Mock;

    const renderFilterSelector = () => render(
        <FilterSelector categories={categories} onClick={onClick} />
    );

    const expectOnClickToHaveBeenCalledWithId = (onClick: jest.Mock, calledTimes: number, id: number) => {
        expect(onClick).toHaveBeenCalledTimes(calledTimes);
        expect(onClick).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    values: expect.arrayContaining([
                        expect.objectContaining({
                            id
                        })
                    ])
                })
            ])
        );
    };

    beforeEach(() => {
        onClick = jest.fn();
    });

    test("Caso 1: pausa cambio de carrera y confirma actualización", () => {
        // Paso 1
        const { getByText, getByTestId, queryByTestId } = renderFilterSelector();

        fireEvent.click(getByText("ABC", { selector: "button" }));

        // isDegreeSelected
        expectOnClickToHaveBeenCalledWithId(onClick, 1, 0);

        // Paso 2
        fireEvent.click(getByText("XYZ", { selector: "button" }));

        // Paso 3
        // No ha confirmado
        expectOnClickToHaveBeenCalledWithId(onClick, 1, 0);

        // Paso 4
        expect(getByTestId("confirm")).toBeInTheDocument();

        // Paso 5
        fireEvent.click(getByTestId("confirm"));
        expect(queryByTestId("confirm")).toBeNull();

        // Paso 6
        expectOnClickToHaveBeenCalledWithId(onClick, 2, 1);
    });

    test("Caso 2: selección inicial sin pausa y sin mostrar alerta (regresión)", () => {
        // Paso 1
        const { getByText, queryByTestId } = renderFilterSelector();

        // Paso 2
        fireEvent.click(getByText("ABC", { selector: "button" }));

        // Paso 3
        expect(queryByTestId("confirm")).toBeNull();

        // Paso 5
        expectOnClickToHaveBeenCalledWithId(onClick, 1, 0);
    });
});
