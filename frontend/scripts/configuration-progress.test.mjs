import test from 'node:test';
import assert from 'node:assert/strict';
import {configurationProgress, sumConfigurationProgress, submittedFieldCount} from '../src/shared/configurationProgress.ts';
test('counts weighted configuration fields across five subtasks', () => {
 const progress=sumConfigurationProgress([configurationProgress(10,10),...Array.from({length:4},()=>configurationProgress(10,30))]);
 assert.equal(progress.total,130);assert.equal(progress.completed,50);assert.equal(progress.percent.toFixed(2),'38.46');
});
test('multiple vehicle rows count a submitted field once and drafts count zero',()=>{
 const fields=[{tag:'A',values:['one','two']},{tag:'B',values:['three','four']},{tag:'A',values:['','five']}];
 assert.equal(submittedFieldCount(fields,[{tag:'A',status:'submitted'},{tag:'B',status:'filling'}],'active'),1);
 assert.equal(submittedFieldCount(fields,undefined,'submitting'),0);
 assert.equal(submittedFieldCount(fields,undefined,'reviewing'),2);
 assert.equal(submittedFieldCount(fields,[{tag:'A',status:'returned'}],'active'),0);
});
test('empty configuration totals produce a finite zero percentage',()=>{
 assert.deepEqual(configurationProgress(0,0),{completed:0,total:0,percent:0});
});

import { formatPercentage } from '../src/shared/percentage.ts';
test('percentages use up to two decimals without trailing zeros',()=>{
 for(const [value,expected] of [[0,'0%'],[50,'50%'],[28.5,'28.5%'],[28.5714,'28.57%'],[99.999,'100%'],[NaN,'—']]) assert.equal(formatPercentage(value),expected);
});
