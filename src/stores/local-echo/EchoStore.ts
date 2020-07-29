/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { EventEmitter } from "events";
import { CachedEcho } from "./CachedEcho";
import { Room } from "matrix-js-sdk/src/models/room";
import { RoomCachedEcho } from "./RoomCachedEcho";
import { RoomEchoContext } from "./RoomEchoContext";
import { AsyncStoreWithClient } from "../AsyncStoreWithClient";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { ActionPayload } from "../../dispatcher/payloads";

type ContextKey = string;

const roomContextKey = (room: Room): ContextKey => `room-${room.roomId}`;

export class EchoStore extends AsyncStoreWithClient<any> {
    private static _instance: EchoStore;

    private caches = new Map<ContextKey, CachedEcho<any, any, any>>();

    constructor() {
        super(defaultDispatcher);
    }

    public static get instance(): EchoStore {
        if (!EchoStore._instance) {
            EchoStore._instance = new EchoStore();
        }
        return EchoStore._instance;
    }

    public getOrCreateEchoForRoom(room: Room): RoomCachedEcho {
        if (this.caches.has(roomContextKey(room))) {
            return this.caches.get(roomContextKey(room)) as RoomCachedEcho;
        }
        const echo = new RoomCachedEcho(new RoomEchoContext(room));
        echo.setClient(this.matrixClient);
        this.caches.set(roomContextKey(room), echo);
        return echo;
    }

    protected async onReady(): Promise<any> {
        for (const echo of this.caches.values()) {
            echo.setClient(this.matrixClient);
        }
    }

    protected async onNotReady(): Promise<any> {
        for (const echo of this.caches.values()) {
            echo.setClient(null);
        }
    }

    protected async onAction(payload: ActionPayload): Promise<any> {
        // We have nothing to actually listen for
        return Promise.resolve();
    }
}
