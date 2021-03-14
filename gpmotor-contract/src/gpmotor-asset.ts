/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class GpmotorAsset {

    @Property()
    public value: string;
    public maker: string;
    public model: string;
    public year: number;
    public remark: string;

}
