// components/VersionComparison.tsx
'use client';

import { OSMElement } from '@/types';
import React from 'react';

interface VersionComparisonProps {
    oldVersion: OSMElement;
    newVersion: OSMElement;
}

export default function VersionComparison({ oldVersion, newVersion }: VersionComparisonProps) {

    console.log('Comparing versions:', oldVersion.version, 'to', newVersion.version);
    console.log('Old version data:', oldVersion);
    console.log('New version data:', newVersion);

    const allTagKeys = new Set([
        ...Object.keys(oldVersion.tags || {}),
        ...Object.keys(newVersion.tags || {})
    ]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
                Changes from Version {oldVersion.version} to {newVersion.version}
            </h2>

            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    Changed by {newVersion.user} on {new Date(newVersion.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                    Changeset: <a href={`https://www.openstreetmap.org/changeset/${newVersion.changeset}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">
                        {newVersion.changeset}
                    </a>
                </p>
            </div>

            <div className="space-y-4">
                {/* Basic properties comparison */}
                <div>
                    <h3 className="font-medium text-lg mb-2">Basic Properties</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="font-semibold">Property</div>
                        <div className="font-semibold">Old Value</div>
                        <div className="font-semibold">New Value</div>

                        {oldVersion.lat !== undefined && (
                            <>
                                <div>Latitude</div>
                                <div>{oldVersion.lat}</div>
                                <div className={oldVersion.lat !== newVersion.lat ? 'text-green-600 font-medium' : ''}>
                                    {newVersion.lat}
                                </div>
                            </>
                        )}

                        {oldVersion.lon !== undefined && (
                            <>
                                <div>Longitude</div>
                                <div>{oldVersion.lon}</div>
                                <div className={oldVersion.lon !== newVersion.lon ? 'text-green-600 font-medium' : ''}>
                                    {newVersion.lon}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tags comparison */}
                <div>
                    <h3 className="font-medium text-lg mb-2">Tags</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="font-semibold">Tag</div>
                        <div className="font-semibold">Old Value</div>
                        <div className="font-semibold">New Value</div>

                        {Array.from(allTagKeys).map(key => {
                            const oldValue = oldVersion.tags?.[key] || '';
                            const newValue = newVersion.tags?.[key] || '';
                            const isAdded = oldValue === '' && newValue !== '';
                            const isRemoved = oldValue !== '' && newValue === '';
                            const isChanged = oldValue !== newValue && !isAdded && !isRemoved;

                            return (
                                <React.Fragment key={key}>
                                    <div>{key}</div>
                                    <div className={isRemoved ? 'text-red-600 line-through' : ''}>
                                        {oldValue || '-'}
                                    </div>
                                    <div className={
                                        isAdded ? 'text-green-600 font-medium' :
                                            isChanged ? 'text-blue-600 font-medium' :
                                                isRemoved ? 'text-red-600 line-through' : ''
                                    }>
                                        {newValue || '-'}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* For ways, we could add nodes comparison */}
                {oldVersion.nodes && newVersion.nodes && (
                    <div>
                        <h3 className="font-medium text-lg mb-2">Nodes</h3>
                        <p className="text-sm">
                            {oldVersion.nodes.length} nodes in old version, {newVersion.nodes.length} nodes in new version
                        </p>
                        {/* We could add more detailed node comparison here */}
                    </div>
                )}

                {/* For relations, we could add members comparison */}
                {oldVersion.members && newVersion.members && (
                    <div>
                        <h3 className="font-medium text-lg mb-2">Members</h3>
                        <p className="text-sm">
                            {oldVersion.members.length} members in old version, {newVersion.members.length} members in new version
                        </p>
                        {/* We could add more detailed member comparison here */}
                    </div>
                )}
            </div>
        </div>
    );
}
