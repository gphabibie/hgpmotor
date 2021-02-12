/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { GpmotorAsset } from './gpmotor-asset';

@Info({title: 'GpmotorAssetContract', description: 'My Smart Contract' })
export class GpmotorAssetContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async gpmotorAssetExists(ctx: Context, gpmotorAssetId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(gpmotorAssetId);
        return (!!data && data.length > 0);
    }

    @Transaction()
    public async createGpmotorAsset(ctx: Context, gpmotorAssetId: string, value: string): Promise<void> {
        const exists: boolean = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} already exists`);
        }
        const gpmotorAsset: GpmotorAsset = new GpmotorAsset();
        gpmotorAsset.value = value;
        const buffer: Buffer = Buffer.from(JSON.stringify(gpmotorAsset));
        await ctx.stub.putState(gpmotorAssetId, buffer);
    }

    @Transaction(false)
    @Returns('GpmotorAsset')
    public async readGpmotorAsset(ctx: Context, gpmotorAssetId: string): Promise<GpmotorAsset> {
        const exists: boolean = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (!exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(gpmotorAssetId);
        const gpmotorAsset: GpmotorAsset = JSON.parse(data.toString()) as GpmotorAsset;
        return gpmotorAsset;
    }

    @Transaction()
    public async updateGpmotorAsset(ctx: Context, gpmotorAssetId: string, newValue: string): Promise<void> {
        const exists: boolean = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (!exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} does not exist`);
        }
        const gpmotorAsset: GpmotorAsset = new GpmotorAsset();
        gpmotorAsset.value = newValue;
        const buffer: Buffer = Buffer.from(JSON.stringify(gpmotorAsset));
        await ctx.stub.putState(gpmotorAssetId, buffer);
    }

    @Transaction()
    public async deleteGpmotorAsset(ctx: Context, gpmotorAssetId: string): Promise<void> {
        const exists: boolean = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (!exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} does not exist`);
        }
        await ctx.stub.deleteState(gpmotorAssetId);
    }
    @Transaction(false)
    public async queryAllAssets(ctx: Context): Promise<string> {
        const startKey = '000';
        const endKey = '999';
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    public async hasRole(ctx: Context, roles: string[]) {
        const clientID = ctx.clientIdentity;
        for (const roleName of roles) {
            if (clientID.assertAttributeValue('role', roleName)) {
                if (clientID.getMSPID() === 'Org1MSP' && clientID.getAttributeValue('role') === 'Manufacturer') { return true; }
                if (clientID.getMSPID() === 'Org2MSP' && clientID.getAttributeValue('role') === 'Dealer') { return true; }
            }
        }
        return false;
    }

    
}
