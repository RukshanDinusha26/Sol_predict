import React from 'react';
import { ShieldAlert, Info, Calendar } from 'lucide-react';

export default function HUD({ prediction, timelineIndex, setTimelineIndex, maxDays }) {
    const isHighThreat = prediction.threat_level > 50;

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', // Let clicks pass through to canvas
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', padding: '2rem',
            boxSizing: 'border-box'
        }}>
            {/* Threat Status */}
            <div
                className="glass"
                style={{
                    pointerEvents: 'auto',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert color={isHighThreat ? '#ff4444' : '#44bbff'} size={24} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, letterSpacing: '1px' }}>
                        SOLAR WEATHER
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Threat Level</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            color: isHighThreat ? '#ff4444' : '#ffffff'
                        }}>
                            {prediction.threat_level.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Projected Flare Class</span>
                    <div style={{
                        marginTop: '4px',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        background: isHighThreat ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: isHighThreat ? '#ff4444' : '#ffffff',
                        display: 'inline-block',
                        fontWeight: 'bold',
                        border: `1px solid ${isHighThreat ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`
                    }}>
                        CLASS {prediction.projected_flare_class}
                    </div>
                </div>
            </div>

            {/*imeline */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div
                    className="glass"
                    style={{
                        pointerEvents: 'auto',
                        padding: '1rem 2rem',
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        width: '70%',
                        maxWidth: '800px'
                    }}
                >
                    <Calendar size={20} opacity={0.7} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.8 }}>
                            <span>- 5 Years</span>
                            <span style={{
                                fontWeight: 'bold',
                                color: prediction.is_historical ? '#aaddff' : '#ffaa00'
                            }}>
                                {prediction.is_historical ? 'HISTORICAL DATA' : 'PREDICTION'}
                                ({prediction.day_offset > 0 ? '+' : ''}{prediction.day_offset} Days)
                            </span>
                            <span>+ 5 Years</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={maxDays - 1}
                            value={timelineIndex}
                            onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                accentColor: prediction.is_historical ? '#aaddff' : '#ffaa00'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}
