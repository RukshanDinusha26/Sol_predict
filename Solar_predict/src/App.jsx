import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Scene from './components/Scene';
import HUD from './components/HUD';
import dummyData from '../public/prediction_5yr.json';

function App() {
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    // In a real app we might fetch this from an API or public folder
    setPredictionData(dummyData);
    if (dummyData?.predictions?.length) {
      // Start the timeline index right in the middle at "Today"
      setTimelineIndex(Math.floor(dummyData.predictions.length / 2));
    }
  }, []);

  const currentPrediction = predictionData?.predictions[timelineIndex];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 10, 45], fov: 45 }}>
        <color attach="background" args={['#000005']} />

        <Suspense fallback={null}>
          <Scene threatLevel={currentPrediction?.threat_level || 0} />
          <Environment preset="night" />
        </Suspense>

        <OrbitControls
          enablePan={true}
          panSpeed={1.0}
          minDistance={15}
          maxDistance={80}
          maxPolarAngle={Math.PI / 1.5}
        />

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>
      </Canvas>

      {currentPrediction && (
        <HUD
          prediction={currentPrediction}
          timelineIndex={timelineIndex}
          setTimelineIndex={setTimelineIndex}
          maxDays={predictionData.predictions.length}
        />
      )}
    </div>
  );
}

export default App;
