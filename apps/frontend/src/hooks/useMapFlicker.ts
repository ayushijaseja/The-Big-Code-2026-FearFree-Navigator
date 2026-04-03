import { useState, useEffect } from 'react';

export const useMapFlicker = (dependencies: any[]) => {
    const [isMapAlive, setIsMapAlive] = useState(true);

    useEffect(() => {
        setIsMapAlive(false);

        const timeout = setTimeout(() => {
            setIsMapAlive(true);
        }, 50);

        return () => clearTimeout(timeout);
    }, dependencies); 

    return isMapAlive;
};