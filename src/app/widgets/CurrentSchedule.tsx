import { Course } from '@/domain/entities/Course';
import { Schedule } from '@/domain/entities/Schedule';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useRef, useState } from 'react';
import { Pivot } from '../../domain/entities/Pivot';
import GoogleCalendarButton from '../components/GoogleCalendarButton';
import ICSButton from '../components/ICSButton';

type Props = {
    schedule: Schedule;
    pivots?: Pivot[];
    pinnedSubjects?: number[];
    label: string;
    showConflicts?: boolean;
    setShowConflicts?: (show: boolean) => void;
}



function CurrentSchedule({ schedule, pivots, label, pinnedSubjects, showConflicts: externalShowConflicts, setShowConflicts: externalSetShowConflicts }: Props) {

    //Prueba de google
    const [start] = useState(new Date('2026-01-12T08:00:00'));
    const [end] = useState(new Date('2026-05-28T09:00:00'));
    const session = useSession();
    const supabase = useSupabaseClient();


    // Referencia para el popup
    const popupRef = useRef<Window | null>(null);
    const exportMenuRef = useRef<HTMLDivElement | null>(null);

    const [internalShowConflicts, setInternalShowConflicts] = useState(false);
    const [showShareLink, setShowShareLink] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Usar el estado externo si está disponible, de lo contrario usar el interno
    const showConflicts = externalShowConflicts !== undefined ? externalShowConflicts : internalShowConflicts;
    const setShowConflicts = externalSetShowConflicts || setInternalShowConflicts;

    async function GoogleSignIn() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar',
                redirectTo: window.location.href,
                skipBrowserRedirect: true, // Importante para obtener la URL sin redirigir
            }
        });

        if (error) {
            console.error('Error signing in:', error.message);
            alert('Error signing in: ' + error.message);
            return;
        }

        if (data?.url) {
            // Abrir el flujo de Google en un popup y guardar la referencia
            popupRef.current = window.open(data.url, 'oauthPopup', 'width=600,height=700');
        }
    }

    // Cerrar el popup cuando la sesión cambie (usuario autenticado)
    useEffect(() => {
        if (session && popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
            popupRef.current = null;
        }
    }, [session]);

    // Cerrar el menú de exportación al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        }

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showExportMenu]);

    // async function GoogleSignOut() {
    //     await supabase.auth.signOut();
    // }
    //google termina

    const colors = [
        "#AA6AFF",
        "#00B0FF",
        "#FF70E9",
        "#FFA647",
        "#6D8CFF",
        "#FF5C8A",
        "#4DFFB8",
        "#FFD94D",
        "#B570FF",
        "#4F6CFF",
    ]

    const totalCredits = schedule ? schedule.subjects.reduce((sum, subject) => sum + subject.credits, 0) : 0;

    return schedule ?
        <div className='md:h-full  overflow-auto p-2 md:pb-2 pb-32  top-0 relative'>


            <div className='relative flex flex-col gap-2 mb-5 lg:sticky lg:top-0'>
                <div className='absolute h-full w-full -z-20 backdrop-blur-sm'></div>

                <div className='flex flex-row gap-2 items-center'>
                    <h2 className="text-center text-lg p-2 font-bold bg-black rounded-full text-white dark:bg-white dark:text-black">{label}</h2>

                    <ShareLinkButton schedule={schedule} setShowShareLink={setShowShareLink} showShareLink={showShareLink} />

                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="bg-blue-700 hover:bg-green-700 p-2 rounded-full flex items-center justify-center transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-480ZM202-65l-56-57 118-118h-90v-80h226v226h-80v-89L202-65Zm278-15v-80h240v-440H520v-200H240v400h-80v-400q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H480Z"/></svg>
                        </button>

                        {showExportMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]">
                                <div className="p-2">
                                    {session && session.expires_at && session.expires_at < Date.now() / 1000 ? (
                                        <button
                                            onClick={async () => {
                                                setShowExportMenu(false);
                                                const Swal = (await import('sweetalert2')).default;
                                                const result = await Swal.fire({
                                                    icon: 'info',
                                                    title: 'Sesión expirada',
                                                    text: 'Tu sesión de Google ha expirado. Por favor, inicia sesión nuevamente para exportar tu horario.',
                                                    confirmButtonText: 'Iniciar sesión',
                                                    showCancelButton: true,
                                                    cancelButtonText: 'Cancelar'
                                                });

                                                if (result.isConfirmed) {
                                                    await GoogleSignIn();
                                                }
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                                                <rect width="22" height="22" x="13" y="13" fill="#fff"></rect><polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616"></polygon><path fill="#1e88e5" d="M22.943,23.745c0.625-0.574,1.013-1.37,1.013-2.249c0-1.747-1.533-3.168-3.417-3.168 c-1.602,0-2.972,1.009-3.33,2.453l1.657,0.421c0.165-0.664,0.868-1.146,1.673-1.146c0.942,0,1.709,0.646,1.709,1.44 c0,0.794-0.767,1.44-1.709,1.44h-0.997v1.728h0.997c1.081,0,1.993,0.751,1.993,1.64c0,0.904-0.866,1.64-1.931,1.64 c-0.962,0-1.784-0.61-1.914-1.418L17,26.802c0.262,1.636,1.81,2.87,3.6,2.87c2.007,0,3.64-1.511,3.64-3.368 C24.24,25.281,23.736,24.363,22.943,23.745z"></path><polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38"></polygon><polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34"></polygon><path fill="#1e88e5" d="M34,14l1-4l-1-4H9C7.343,6,6,7.343,6,9v25l4,1l4-1V14H34z"></path><polygon fill="#e53935" points="34,34 34,42 42,34"></polygon><path fill="#1565c0" d="M39,6h-5v8h8V9C42,7.343,40.657,6,39,6z"></path><path fill="#1565c0" d="M9,42h5v-8H6v5C6,40.657,7.343,42,9,42z"></path>
                                            </svg>
                                            <span className="text-sm">Iniciar sesión con Google</span>
                                        </button>
                                    ) : session ? (
                                        <div
                                            onClick={() => setShowExportMenu(false)}
                                            className="w-full"
                                        >
                                            <GoogleCalendarButton
                                                schedule={schedule}
                                                recurrenceStart={start}
                                                recurrenceEnd={end}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                setShowExportMenu(false);
                                                const Swal = (await import('sweetalert2')).default;
                                                const result = await Swal.fire({
                                                    title: 'Acceso Requerido',
                                                    text: 'Debes iniciar sesión con Google para exportar tu horario a tu calendario. Nos encontramos en proceso de validación de Google, tranquil@, no mordemos.',
                                                    imageUrl: '/img/google_export.jpg',
                                                    imageHeight: 400,
                                                    confirmButtonText: 'Iniciar sesión',
                                                    showCancelButton: true,
                                                    cancelButtonText: 'Cancelar'
                                                });

                                                if (result.isConfirmed) {
                                                    await GoogleSignIn();
                                                }
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                                                <rect width="22" height="22" x="13" y="13" fill="#fff"></rect><polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616"></polygon><path fill="#1e88e5" d="M22.943,23.745c0.625-0.574,1.013-1.37,1.013-2.249c0-1.747-1.533-3.168-3.417-3.168 c-1.602,0-2.972,1.009-3.33,2.453l1.657,0.421c0.165-0.664,0.868-1.146,1.673-1.146c0.942,0,1.709,0.646,1.709,1.44 c0,0.794-0.767,1.44-1.709,1.44h-0.997v1.728h0.997c1.081,0,1.993,0.751,1.993,1.64c0,0.904-0.866,1.64-1.931,1.64 c-0.962,0-1.784-0.61-1.914-1.418L17,26.802c0.262,1.636,1.81,2.87,3.6,2.87c2.007,0,3.64-1.511,3.64-3.368 C24.24,25.281,23.736,24.363,22.943,23.745z"></path><polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38"></polygon><polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34"></polygon><path fill="#1e88e5" d="M34,14l1-4l-1-4H9C7.343,6,6,7.343,6,9v25l4,1l4-1V14H34z"></path><polygon fill="#e53935" points="34,34 34,42 42,34"></polygon><path fill="#1565c0" d="M39,6h-5v8h8V9C42,7.343,40.657,6,39,6z"></path><path fill="#1565c0" d="M9,42h5v-8H6v5C6,40.657,7.343,42,9,42z"></path>
                                            </svg>
                                            <span className="text-sm">Google Calendar</span>
                                        </button>
                                    )}

                                    <div
                                        onClick={() => setShowExportMenu(false)}
                                        className="mt-1 w-full"
                                    >
                                        <ICSButton schedule={schedule} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                   
                </div>

                <div className='grid grid-cols-2 gap-2 '>
                    <div className='flex flex-col items-center'>
                        <span className=''>Materias</span>
                        <div className='text-white bg-black dark:bg-white dark:text-black px-2 rounded-full' style={{ lineHeight: 1.5 }}>
                            {schedule?.subjects.length ?? 0}
                        </div>
                    </div>
                    <div className='flex flex-col items-center'>
                        <span className=''>Créditos</span>
                        <div className='text-white bg-black dark:bg-white dark:text-black px-2 rounded-full' style={{ lineHeight: 1.5 }}>
                            {totalCredits}
                        </div>
                    </div>
                </div>
            </div>

            {schedule.incompatibleCourses && schedule.incompatibleCourses.length > 0 ? (
                <div className="my-6">
                    <button
                        onClick={() => setShowConflicts(!showConflicts)}
                        className={`w-full ${showConflicts ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            {showConflicts ? (
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            ) : (
                                <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                            )}
                        </svg>
                        {showConflicts ? 'Ocultar conflictos' : `Ver conflictos (${schedule.incompatibleCourses.length})`}
                    </button>

                    {showConflicts && (
                        <div className="mt-4 border-2 border-red-500 rounded-lg p-4">
                            <h3 className="font-bold  mb-3 text-red-600 dark:text-red-400">Cursos en conflicto:</h3>
                            <div className="space-y-2">
                                {schedule.incompatibleCourses.map((course, index) => (
                                    <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
                                        <div className="text-sm font-semibold">{course.subject.name}</div>
                                        <div className="text-sm flex items-center gap-2 mt-1">
                                            <svg className='dark:fill-white fill-black' xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px">
                                                <path d="M480-240q-56 0-107 17.5T280-170v10h400v-10q-42-35-93-52.5T480-240Zm0-80q69 0 129 21t111 59v-560H240v560q51-38 111-59t129-21Zm0-160q-25 0-42.5-17.5T420-540q0-25 17.5-42.5T480-600q25 0 42.5 17.5T540-540q0 25-17.5 42.5T480-480ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm240-320q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-140Z" />
                                            </svg>
                                            {course.professor.fullName}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {course.subject.type} • Grupo {course.group} • {course.modality}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) :
                <button
                    onClick={() => setShowConflicts(!showConflicts)}
                    className={`w-full  text-green-500 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors`}
                >
                    <svg className='fill-green-500' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
                    Sin conflictos
                </button>
            }

            <div className=''>
                {schedule.courses.map((course, index) => (
                    <div key={index} >
                        {CourseCard(course, colors, pivots ?? [], pinnedSubjects ?? [])}
                    </div>
                ))}
            </div>


        </div>
        :
        <div className="px-10">

            <p className="text-center mt-10">Prueba con otras materias y/o profesores</p>


        </div>
}

// Revisa el componente GoogleCalendarButton para asegurarte de que los hooks solo se usen en el cuerpo del componente o en custom hooks.
// El error "Invalid hook call" generalmente ocurre por eso.






type ShareLinkButtonProps = {
    schedule: Schedule;
    setShowShareLink: (link: string | null) => void;
    showShareLink: string | null;
}

function CourseCard(course: Course, colors: string[], pivots: Pivot[], pinnedSubjects: number[]) {

    const isProfessorPinned = pivots?.some(
        selectedPivot => (
            selectedPivot.idProfessor === course.professor.id && selectedPivot.idSubject == course.subject.id
        )
    );
    const isSubjectPinned = pinnedSubjects.includes(course.subject.id);

    return <div className="mb-4 border-2 p-4 pl-2 rounded-lg border-gray-500 text-small flex flex-row">

        <div className='w-1 mr-3  rounded' style={{ backgroundColor: colors[course.subject.id % colors.length] }}></div>
        <div className='w-full'>
            <div className=" font-semibold flex flex-row items-center w-full">

                <div className='flex-1'>
                    {course.subject.name}

                </div>


                {isSubjectPinned ? <div className='rounded-large bg-purple-900 inline h-max ml-2 my-1'>
                    <svg className='fill-white' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z" /></svg>
                </div>
                    : ""}




            </div>
            {course.modality}

            <div className='w-full mr-3 h-1 my-2 rounded' style={{ backgroundColor: colors[course.subject.id % colors.length] }}></div>

            <div className='flex flex-row items-center'>
                {course.subject.type}
                <div className='h-2 w-2 bg-dark dark:bg-white rounded-full mx-2'></div>
                Grupo {course.group}

                <div className='h-2 w-2 bg-dark dark:bg-white rounded-full mx-2'></div>

                {course.subject.credits} Créditos
            </div>




            <div className='flex flex-row items-center '>
                {isProfessorPinned ? <div className='rounded-large bg-purple-900 inline h-max mr-2 my-1'>
                    <svg className='fill-white' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z" /></svg>
                </div>
                    : ""}

                <svg className='mr-2 dark:fill-white fill-black' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-240q-56 0-107 17.5T280-170v10h400v-10q-42-35-93-52.5T480-240Zm0-80q69 0 129 21t111 59v-560H240v560q51-38 111-59t129-21Zm0-160q-25 0-42.5-17.5T420-540q0-25 17.5-42.5T480-600q25 0 42.5 17.5T540-540q0 25-17.5 42.5T480-480ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm240-320q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-140Z" /></svg>

                {course.professor.fullName}
            </div>
        </div>


    </div>;
}

function ShareLinkButton({ schedule, setShowShareLink, showShareLink }: ShareLinkButtonProps) {
    const [isCopied, setIsCopied] = useState(false);
    return (
        <>

            <button
                onClick={async () => {
                    const coursesIds = schedule.courses.map(course => course.id);
                    const shareLink = `${window.location.href}/horario?ids=${coursesIds.toString()}`;
                    setShowShareLink(shareLink);
                }}
                className="bg-blue-700  p-2 rounded-full flex items-center justify-center"
            >
                <svg className='' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" /></svg>

            </button>
            {showShareLink &&

                <div className="absolute z-20 w-full animate-appearance-in  flex flex-row items-center justify-center gap-3 dark:bg-[#111] bg-white p-1.5  rounded-lg">
                    <div className="flex-1 text-xs dark:text-white text-black overflow-hidden truncate dark:bg-gray-800 dark:border-none border border-black  p-2 py-2.5 rounded-md">
                        {showShareLink}
                    </div>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(showShareLink);
                            setIsCopied(true);
                            setTimeout(() => {
                                setIsCopied(false);
                                setShowShareLink(null);
                            }, 1000);
                        }}
                        className="   dark:text-white text-sm "
                    >

                        {isCopied ? 'Copiado!' : <svg className='inline dark:fill-white fill-black' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" /></svg>}
                    </button>
                    <button
                        onClick={() => setShowShareLink(null)}
                        className="   text-white "
                        aria-label="Cerrar"
                    >
                        <svg className='dark:fill-white fill-black  ' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                    </button>
                </div>
            }
        </>
    )
}

export default CurrentSchedule




