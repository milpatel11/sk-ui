"use client";
import React, {useMemo} from 'react';
import {Box} from '@mui/material';

export interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    type: 'stop' | 'vehicle';
    label?: string;
    color?: string;
}

// Make projection padding configurable
function project(points: MapPoint[], pad = 0.02) {
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const dLat = (maxLat - minLat) || 0.001; // avoid 0
    const dLng = (maxLng - minLng) || 0.001;
    return {
        minLat: minLat - dLat * pad,
        maxLat: maxLat + dLat * pad,
        minLng: minLng - dLng * pad,
        maxLng: maxLng + dLng * pad
    };
}

export interface ShuttleMapProps {
    points: MapPoint[];
    height?: number;
    padPercent?: number; // 0.02 = 2% padding by default
    showLabels?: boolean; // toggle point labels
    onPointClick?: (point: MapPoint) => void;
    ariaLabel?: string; // accessible label for the map container
}

export const ShuttleMap: React.FC<ShuttleMapProps> = ({
    points,
    height = 260,
    padPercent = 0.02,
    showLabels = true,
    onPointClick,
    ariaLabel
}) => {
    const bounds = useMemo(() => points.length ? project(points, padPercent) : null, [points, padPercent]);
    const hasPoints = points.length > 0;

    return (
        <Box position="relative" role="region" aria-label={ariaLabel ?? `Map with ${points.length} point${points.length === 1 ? '' : 's'}`}
             sx={{
                 border: '1px solid',
                 borderColor: 'divider',
                 borderRadius: 2,
                 overflow: 'hidden',
                 width: '100%',
                 height
             }}>
            {/* Empty state */}
            {!hasPoints && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'text.secondary', fontSize: 14
                }}>
                    No points to display
                </Box>
            )}

            {/* Points layer */}
            <Box position="absolute" sx={{ inset: 0 }}>
                {bounds && hasPoints && points.map(p => {
                    const x = (p.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
                    const y = 1 - (p.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
                    const left = `${Math.min(100, Math.max(0, x * 100))}%`;
                    const top = `${Math.min(100, Math.max(0, y * 100))}%`;
                    const size = p.type === 'vehicle' ? 12 : 8;
                    const bg = p.type === 'vehicle' ? (p.color || '#1976d2') : (p.color || '#9e9e9e');
                    const aria = `${p.type}${p.label ? ` ${p.label}` : ''} at latitude ${p.lat.toFixed(5)}, longitude ${p.lng.toFixed(5)}`;
                    return (
                        <Box key={p.id} position="absolute" left={left} top={top}
                             role={onPointClick ? 'button' : 'img'}
                             aria-label={aria}
                             tabIndex={onPointClick ? 0 : -1}
                             title={p.label ?? p.id}
                             onClick={onPointClick ? () => onPointClick(p) : undefined}
                             onKeyDown={onPointClick ? (e) => {
                                 if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault();
                                     onPointClick(p);
                                 }
                             } : undefined}
                             sx={{transform: 'translate(-50%, -50%)', cursor: onPointClick ? 'pointer' : 'default'}}>
                            <Box sx={{
                                width: size,
                                height: size,
                                borderRadius: '50%',
                                bgcolor: bg,
                                border: '2px solid #fff',
                                boxShadow: 2
                            }}/>
                            {showLabels && p.label && <Box sx={{
                                position: 'absolute',
                                top: size + 4,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: 11,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                px: 0.5,
                                borderRadius: 1
                            }}>{p.label}</Box>}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ShuttleMap;