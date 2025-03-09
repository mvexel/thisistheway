// components/Timeline.tsx
'use client';

import { useRef, useState } from 'react';
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
    const [expandedCluster, setExpandedCluster] = useState<number | null>(null);

    // Sort versions by timestamp
    const sortedVersions = [...versions].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const startDate = new Date(sortedVersions[0]?.timestamp || Date.now());
    const endDate = new Date(sortedVersions[sortedVersions.length - 1]?.timestamp || Date.now());

    const createClusters = () => {
        if (sortedVersions.length === 0) return [];

        // 6 month threshold in milliseconds to reduce overlapping clusters
        const timeThreshold = 1000 * 60 * 60 * 24 * 180; // 6 months

        const clusters = [];

        // Start with the first version
        let currentCluster = [0];

        // Group versions that are close in time
        for (let i = 1; i < sortedVersions.length; i++) {
            const prevTime = new Date(sortedVersions[i - 1].timestamp).getTime();
            const currTime = new Date(sortedVersions[i].timestamp).getTime();

            if (currTime - prevTime < timeThreshold) {
                currentCluster.push(i);
            } else {
                // Add the completed cluster
                clusters.push({
                    indices: [...currentCluster],
                    size: currentCluster.length
                });
                // Start a new cluster
                currentCluster = [i];
            }
        }

        // Add the last cluster
        if (currentCluster.length > 0) {
            clusters.push({
                indices: [...currentCluster],
                size: currentCluster.length
            });
        }

        return clusters;
    };

    const clusters = createClusters();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Toggle cluster expansion
    const toggleCluster = (clusterIndex: number) => {
        if (expandedCluster === clusterIndex) {
            setExpandedCluster(null);
        } else {
            setExpandedCluster(clusterIndex);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit History Timeline</h2>

            <div className="flex justify-between mb-2 text-sm text-gray-600">
                <span>{formatDate(startDate)}</span>
                <span>{formatDate(endDate)}</span>
            </div>

            {/* Main timeline */}
            <div
                ref={timelineRef}
                className="relative h-16 bg-gray-200 rounded-full mb-4"
            >
                {/* Center line */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-1 w-full bg-gray-400"></div>
                </div>
                <div className="absolute inset-0 flex items-center">
                    {clusters.map((cluster, clusterIndex) => {
                        // Use the middle version of the cluster for positioning
                        const midIndex = Math.floor(cluster.indices.length / 2);
                        const representativeIndex = cluster.indices[midIndex];
                        const version = sortedVersions[representativeIndex];

                        const versionTime = new Date(version.timestamp).getTime();
                        const startTime = startDate.getTime();
                        const endTime = endDate.getTime();
                        const timeRange = endTime - startTime || 1;

                        // Calculate position as percentage
                        const position = ((versionTime - startTime) / timeRange) * 100;

                        // Determine dot size based on cluster size
                        const dotSize = cluster.size === 1 ? 'h-4 w-4' : cluster.size < 5 ? 'h-6 w-6' : 'h-8 w-8';

                        // Check if any version in this cluster is selected
                        const isSelected = selectedVersionIndex !== null &&
                            cluster.indices.includes(selectedVersionIndex);

                        return (
                            <button
                                key={`cluster-${clusterIndex}`}
                                className={`absolute transform -translate-x-1/2 rounded-full ${dotSize} 
                                ${isSelected ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-blue-400 hover:bg-blue-500'}`}
                                style={{ left: `${position}%` }}
                                onClick={() => {
                                    // If it's a single version cluster, select it directly
                                    if (cluster.size === 1) {
                                        onSelectVersion(cluster.indices[0]);
                                    } else {
                                        // Otherwise toggle the cluster expansion
                                        toggleCluster(clusterIndex);
                                    }
                                }}
                                aria-label={`${cluster.size} version${cluster.size > 1 ? 's' : ''} - ${formatDate(new Date(version.timestamp))}`}
                            >
                                {cluster.size > 1 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                        {cluster.size}
                                    </span>
                                )}
                                <div className="absolute opacity-0 hover:opacity-100 transition-opacity duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10">
                                    {cluster.size === 1 
                                        ? `Version ${version.version} - ${new Date(version.timestamp).toLocaleString()}`
                                        : `${cluster.size} versions - ${formatDate(new Date(version.timestamp))}`
                                    }
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Expanded cluster view */}
            {expandedCluster !== null && (
                <div className="mt-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">
                        Select a version from this group:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {clusters[expandedCluster].indices.map(versionIndex => {
                            const version = sortedVersions[versionIndex];
                            return (
                                <button
                                    key={`version-${version.version}`}
                                    className={`p-2 text-left text-sm rounded ${versionIndex === selectedVersionIndex
                                        ? 'bg-blue-100 border border-blue-300'
                                        : 'bg-white border border-gray-200 hover:bg-gray-100'
                                        }`}
                                    onClick={() => {
                                        onSelectVersion(versionIndex);
                                        setExpandedCluster(null);
                                    }}
                                >
                                    <div className="font-medium">Version {version.version}</div>
                                    <div className="text-gray-600 text-xs">
                                        {new Date(version.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-gray-600 text-xs truncate">
                                        by {version.user}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-700 mt-2">
                {selectedVersionIndex !== null && (
                    <div>
                        <p>
                            <span className="font-semibold">Selected:</span> Version {sortedVersions[selectedVersionIndex]?.version} - {" "}
                            {new Date(sortedVersions[selectedVersionIndex]?.timestamp).toLocaleString()} by {" "}
                            {sortedVersions[selectedVersionIndex]?.user}
                        </p>
                    </div>
                )}
            </div>

            {debugMode && (
                <TimelineDebug
                    versions={sortedVersions}
                    clusters={clusters.map((c, i) => ({
                        index: c.indices[Math.floor(c.indices.length / 2)],
                        size: c.size
                    }))}
                />
            )}
        </div>
    );
}
