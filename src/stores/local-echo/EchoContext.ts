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

import { EchoTransaction, RunFn, TransactionStatus } from "./EchoTransaction";
import { arrayFastClone } from "../../utils/arrays";
import { IDestroyable } from "../../utils/IDestroyable";
import { Whenable } from "../../utils/Whenable";

export enum ContextTransactionState {
    NotStarted,
    PendingErrors,
    AllSuccessful
}

export abstract class EchoContext extends Whenable<ContextTransactionState> implements IDestroyable {
    private _transactions: EchoTransaction[] = [];
    public readonly startTime: Date = new Date();

    public get transactions(): EchoTransaction[] {
        return arrayFastClone(this._transactions);
    }

    public beginTransaction(auditName: string, runFn: RunFn): EchoTransaction {
        const txn = new EchoTransaction(auditName, runFn);
        this._transactions.push(txn);
        txn.whenAnything(this.checkTransactions);

        // We have no intent to call the transaction again if it succeeds (in fact, it'll
        // be really angry at us if we do), so call that the end of the road for the events.
        txn.when(TransactionStatus.DoneSuccess, () => txn.destroy());

        return txn;
    }

    private checkTransactions = () => {
        let status = ContextTransactionState.AllSuccessful;
        for (const txn of this.transactions) {
            if (txn.status === TransactionStatus.DoneError) {
                status = ContextTransactionState.PendingErrors;
                break;
            } else if (txn.status === TransactionStatus.Pending) {
                status = ContextTransactionState.NotStarted;
                // no break as we might hit something which broke
            }
        }
        this.notifyCondition(status);
    };

    public destroy() {
        for (const txn of this.transactions) {
            txn.destroy();
        }
        super.destroy();
    }
}
