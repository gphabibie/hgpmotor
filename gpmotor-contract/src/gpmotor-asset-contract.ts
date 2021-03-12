/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { GpmotorAsset } from './gpmotor-asset';
// update 12 mar 21 12:51
@Info({title: 'GpmotorAssetContract', description: 'My Smart Contract' })
export class GpmotorAssetContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async gpmotorAssetExists(ctx: Context, gpmotorAssetId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(gpmotorAssetId);
        return (!!data && data.length > 0);
    }    

    @Transaction()
    public async createGpmotorAsset(ctx: Context, gpmotorAssetId: string, maker: string, model: string, year: number): Promise<void> {
        const hasAccess = await this.hasRole(ctx, ['Manufacturer']);
        if (!hasAccess) {
            throw new Error(`Only manufacturer can create motor asset`);
        }
        const exists = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (exists) {
            throw new Error(`The gpmotro asset ${gpmotorAssetId} already exists`);
        }
        const gpmotorAsset = new GpmotorAsset();
        gpmotorAsset.maker = maker;
        gpmotorAsset.model = model;
        gpmotorAsset.year = year;
        const buffer = Buffer.from(JSON.stringify(gpmotorAsset));
        await ctx.stub.putState(gpmotorAssetId, buffer);
    }

    @Transaction(false)
    @Returns('GpmotorAsset')
    public async readGpmotorAsset(ctx: Context, gpmotorAssetId: string): Promise<gpmotorAsset> {
        const exists = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (!exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} does not exist`);
        }
        const buffer = await ctx.stub.getState(gpmotorAssetId);
        const gpmotorAsset = JSON.parse(buffer.toString()) as GpmotorAsset;
        return gpmotorAsset;
    }

    @Transaction()
    public async updateGpmotorAsset(ctx: Context, gpmotorAssetId: string, maker: string, model: string, year: number): Promise<void> {
        const hasAccess = await this.hasRole(ctx, ['Manufacturer', 'Dealer']);
        if (!hasAccess) {
            throw new Error(`Only manufacturer or dealer can update motor asset`);
        }
        const exists = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
        if (!exists) {
            throw new Error(`The gpmotor asset ${gpmotorAssetId} does not exist`);
        }
        const gpmotorAsset = new GpmotorAsset();
        gpmotorAsset.maker = maker;
        gpmotorAsset.model = model;
        gpmotorAsset.year = year;
        const buffer = Buffer.from(JSON.stringify(gpmotorAsset));
        await ctx.stub.putState(gpmotorAssetId, buffer);
    }

    @Transaction()
    public async deleteGpmotorAsset(ctx: Context, gpmotorAssetId: string): Promise<void> {
        const hasAccess = await this.hasRole(ctx, ['Dealer']);
        if (!hasAccess) {
            throw new Error(`Only dealer can delete motor asset`);
        }
        const exists = await this.gpmotorAssetExists(ctx, gpmotorAssetId);
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
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
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

    @Transaction(false)
    public async queryByMaker(ctx: Context, maker: string): Promise<string> {
        const query = { selector: { maker } };
        const queryString = JSON.stringify(query);
        const iterator = await ctx.stub.getQueryResult(queryString);
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
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

    @Transaction(false)
    public async queryByMinYear(ctx: Context, min: number, size: number, bookmark?: string): Promise<string> {
        const query = { selector: { year: { $gte: min } } };
        const queryString = JSON.stringify(query);

        const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(queryString, size, bookmark);

        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                const result = {
                    results: allResults,
                    metadata
                };
                console.log('end of data');
                await iterator.close();
                console.info(result);
                return JSON.stringify(result);
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