import test from 'node:test';
import assert from 'node:assert/strict';
import {publicAddresses,checkedLookup} from '../server/transport.js';
test('socket DNS lookup returns only vetted IPs',async()=>{const lookup=checkedLookup(async()=>[{address:'8.8.8.8',family:4}]);const result=await new Promise((resolve,reject)=>lookup('example.com',{all:false},(err,address,family)=>err?reject(err):resolve({address,family})));assert.deepEqual(result,{address:'8.8.8.8',family:4});});
test('rebinding to a private IP fails at socket lookup',async()=>{const lookup=checkedLookup(async()=>[{address:'127.0.0.1',family:4}]);await assert.rejects(new Promise((resolve,reject)=>lookup('example.com',{},(err,ip)=>err?reject(err):resolve(ip))),/engellendi/);});
test('mixed public and private DNS answers fail closed',async()=>{await assert.rejects(publicAddresses('example.com',async()=>[{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}]),/engellendi/);});
test('lookup supports the all-addresses socket API',async()=>{const lookup=checkedLookup(async()=>[{address:'8.8.8.8',family:4},{address:'2606:4700:4700::1111',family:6}]);const addresses=await new Promise((resolve,reject)=>lookup('example.com',{all:true},(e,a)=>e?reject(e):resolve(a)));assert.equal(addresses.length,2);});
