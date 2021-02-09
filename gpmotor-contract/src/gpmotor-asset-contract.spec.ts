/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { GpmotorAssetContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logger = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('GpmotorAssetContract', () => {

    let contract: GpmotorAssetContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new GpmotorAssetContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"gpmotor asset 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"gpmotor asset 1002 value"}'));
    });

    describe('#gpmotorAssetExists', () => {

        it('should return true for a gpmotor asset', async () => {
            await contract.gpmotorAssetExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a gpmotor asset that does not exist', async () => {
            await contract.gpmotorAssetExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createGpmotorAsset', () => {

        it('should create a gpmotor asset', async () => {
            await contract.createGpmotorAsset(ctx, '1003', 'gpmotor asset 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"gpmotor asset 1003 value"}'));
        });

        it('should throw an error for a gpmotor asset that already exists', async () => {
            await contract.createGpmotorAsset(ctx, '1001', 'myvalue').should.be.rejectedWith(/The gpmotor asset 1001 already exists/);
        });

    });

    describe('#readGpmotorAsset', () => {

        it('should return a gpmotor asset', async () => {
            await contract.readGpmotorAsset(ctx, '1001').should.eventually.deep.equal({ value: 'gpmotor asset 1001 value' });
        });

        it('should throw an error for a gpmotor asset that does not exist', async () => {
            await contract.readGpmotorAsset(ctx, '1003').should.be.rejectedWith(/The gpmotor asset 1003 does not exist/);
        });

    });

    describe('#updateGpmotorAsset', () => {

        it('should update a gpmotor asset', async () => {
            await contract.updateGpmotorAsset(ctx, '1001', 'gpmotor asset 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"gpmotor asset 1001 new value"}'));
        });

        it('should throw an error for a gpmotor asset that does not exist', async () => {
            await contract.updateGpmotorAsset(ctx, '1003', 'gpmotor asset 1003 new value').should.be.rejectedWith(/The gpmotor asset 1003 does not exist/);
        });

    });

    describe('#deleteGpmotorAsset', () => {

        it('should delete a gpmotor asset', async () => {
            await contract.deleteGpmotorAsset(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a gpmotor asset that does not exist', async () => {
            await contract.deleteGpmotorAsset(ctx, '1003').should.be.rejectedWith(/The gpmotor asset 1003 does not exist/);
        });

    });

});
