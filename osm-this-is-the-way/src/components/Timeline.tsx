// components/Timeline.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { OSMElement } from '@/types';
import TimelineDebug from './TimelineDebug';

interface TimelineProps {
    versions: OSMElement[];
    selectedVersionIndex: number | null;
    onSelectVersion: (index: number) => void;
    debugMode?: boolean;
}

export default function Timeline({ versions, selectedVersionIndex, onSelectVersion, debugMode }: TimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [clusteredVersions, setClusteredVersions] = useState<Array<{ index: number, size: number }>>([]);

    // Sort versions by timestamp
    const sortedVersions = [...versions].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const startDate = new Date(sortedVersions[0]?.timestamp || Date.now());
    const endDate = new Date(sortedVersions[sortedVersions.length - 1]?.timestamp || Date.now());

    // Cluster versions that are close in time
    useEffect(() => {
        if (versions.length === 0) return;

        console.log("Timeline received versions:", versions)
        console.log("Timeline date range",
            new Date(sortedVersions[0]?.timestamp).toISOString(),
            ' - ',
            new Date(sortedVersions[sortedVersions.length - 1]?.timestamp).toISOString()
        )

        // cluster threshold 1 week
        const timeThreshold = 3600000 * 24 * 7 * 30;

        const clusters: Array<{ index: number, size: number }> = [];

        let currentCluster: number[] = [0];

        for (let i = 1; i < sortedVersions.length; i++) {
            const prevTime = new Date(sortedVersions[i - 1].timestamp).getTime();
            const currTime = new Date(sortedVersions[i].timestamp).getTime();

            if (currTime - prevTime < timeThreshold) {
                currentCluster.push(i);
            } else {
                clusters.push({
                    index: currentCluster[Math.floor(currentCluster.length / 2)],
                    size: currentCluster.length
                });
                currentCluster = [i];
            }
        }

        if (currentCluster.length > 0) {
            clusters.push({
                index: currentCluster[Math.floor(currentCluster.length / 2)],
                size: currentCluster.length
            });
        }

        console.log("Clustered Versions: ", clusters)

        setClusteredVersions(clusters);

    }, [versions]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit History Timeline</h2>

            <div className="flex justify-between mb-2 text-sm text-gray-600">
                <span>{formatDate(startDate)}</span>
                <span>{formatDate(endDate)}</span>
            </div>

            <div
                ref={timelineRef}
                className="relative h-16 bg-gray-200 rounded-full mb-4"
            >
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    {clusteredVersions.map(({ index, size }) => {
                        const version = sortedVersions[index];
                        const versionTime = new Date(version.timestamp).getTime();
                        const startTime = startDate.getTime();
                        const endTime = endDate.getTime();

                        // Calculate position as percentage
                        const position = ((versionTime - startTime) / (endTime - startTime)) * 100;

                        // Determine dot size based on cluster size
                        const dotSize = size === 1 ? 'h-4 w-4' : size < 5 ? 'h-6 w-6' : 'h-8 w-8';

                        return (
                            <button
                                key={`${version.type}-${version.id}-v${version.version}`}
                                className={`absolute transform -translate-x-1/2 rounded-full ${dotSize} 
                  ${index === selectedVersionIndex ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-blue-400 hover:bg-blue-500'}`}
                                style={{ left: `${position}%` }}
                                onClick={() => onSelectVersion(index)}
                                title={`Version ${version.version} - ${new Date(version.timestamp).toLocaleString()}`}
                            >
                                {size > 1 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                        {size}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="text-sm text-gray-700">
                {selectedVersionIndex !== null && (
                    <div>
                        <p>
                            <span className="font-semibold">Selected:</span> Version {sortedVersions[selectedVersionIndex]?.version} -
                            {new Date(sortedVersions[selectedVersionIndex]?.timestamp).toLocaleString()} by
                            {sortedVersions[selectedVersionIndex]?.user}
                        </p>
                    </div>
                )}
            </div>


            {debugMode && (
                <TimelineDebug versions={sortedVersions} clusters={clusteredVersions} />
            )}
        </div>
    );
}
