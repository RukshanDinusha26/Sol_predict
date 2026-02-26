import React from 'react';
import Sun from './Sun';
import Earth from './Earth';
import SolarWind from './SolarWind';
import BowShock from './BowShock';
import { Stars } from '@react-three/drei';

export default function Scene({ threatLevel }) {
    return (
        <>
            <ambientLight intensity={0.05} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <Sun threatLevel={threatLevel} />
            <BowShock threatLevel={threatLevel} />
            <Earth position={[35, 0, 0]} />
            <SolarWind threatLevel={threatLevel} />
        </>
    );
}
