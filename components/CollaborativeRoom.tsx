'use client'

import { RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import React, { ReactNode, useEffect, useRef, useState } from 'react'
import Loader from './Loader'
import { SignedOut, SignInButton, SignedIn, UserButton } from '@clerk/nextjs'
import Header from './Header'
import { Editor } from './editor/Editor'
import ActiveCollaborators from './ActiveCollaborators'
import { Input } from './ui/input'
import Image from 'next/image'
import { updateDocument } from '@/lib/actions/room.actions'
import ShareModal from './ShareModal'

const CollaborativeRoom = ( { roomId, roomMetadata, users, currentUserType }: CollaborativeRoomProps ) => {
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [documentTitle, setDocumentTitle] = useState(roomMetadata.title)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLDivElement>(null)

    const updateTitleHandler = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setLoading(true)
            try {
                if (documentTitle !== roomMetadata.title) {
                    const updatedDocument = await updateDocument(roomId, documentTitle)
                    if (updatedDocument) {
                        setEditing(false);
                    }
                }
            } catch (error) {
                console.log(`${error}`)
            }
            setLoading(false)
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setEditing(false)
                updateDocument(roomId, documentTitle)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [documentTitle])

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }   
    }, [editing])
    return (
        <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={<Loader/>}>
                    <div className='collaborative-room'>
                        <Header>
                            <div ref={containerRef} className='flex w-fit items-center justify-center gap-2'>
                                { editing && !loading ? 
                                    (
                                        <Input 
                                            type='text'
                                            value={documentTitle}
                                            ref={inputRef}
                                            placeholder='Enter title'
                                            onChange={(e) => setDocumentTitle(e.target.value)}
                                            onKeyDown={updateTitleHandler}
                                            disabled={!editing}
                                            className='document-title-input'
                                        />
                                    ): 
                                    (
                                        <>
                                            <p className='document-title'>{documentTitle}</p>
                                        </> 
                                    )
                                }
                                {
                                    currentUserType === 'editor' && !editing && (
                                        <Image 
                                            src='/assets/icons/edit.svg'
                                            alt='edit'
                                            width={24}
                                            height={24}
                                            onClick={()  => setEditing(true)}
                                            className='pointer'
                                        />
                                    )
                                }
                            {
                                currentUserType !== 'editor' && !editing && (
                                   <p className='view-only-tag'>View Only</p>
                                )
                            }

                            { loading && <p className='text-sm'>Saving...</p>}
                            </div>
                            <div className='flex w-full flex-1 justify-end gap-2 sm:gap-3'>
                                <ActiveCollaborators/>
                                <ShareModal
                                    roomId={roomId}
                                    collaborators={users}
                                    creatorId={roomMetadata.creatorId}
                                    currentUserType={currentUserType}
                                />
                            </div>
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </Header>
                        <Editor 
                            roomId={roomId}
                            currentUserType={currentUserType}
                        />
                    </div>
                </ClientSideSuspense>
        </RoomProvider>
    )
}

export default CollaborativeRoom