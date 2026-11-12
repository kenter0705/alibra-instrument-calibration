import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {calculateControl,controlExample,nistFractions} from "../src/lib/spc-control";
import {categoryFrequencies,distributionFrequencies} from "../src/lib/spc-frequency";
import {controlSignals,spcRules} from "../src/lib/spc-rules";
import {spcReference} from "../src/lib/spc-reference";
import {TallyMarks} from "../src/components/checksheet-analysis";
const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const xr=calculateControl("xbar-r","1,2,3,4,5\n2,3,4,5,6\n3,4,5,6,7",5);
close(xr.plots[0].points[0].center,4);close(xr.plots[0].points[0].upper,6.308);close(xr.plots[0].points[0].lower,1.692);close(xr.plots[1].points[0].upper,8.46);
const p=calculateControl("p","2,10\n9,90").plots[0].points;close(p[0].center,.11);assert.notEqual(p[0].upper,p[1].upper);
const np=calculateControl("np","2,10\n4,10").plots[0].points;close(np[0].center,3);close(np[0].upper,3+3*Math.sqrt(2.1));assert.throws(()=>calculateControl("np","2,10\n3,20"));
const c=calculateControl("c","2\n4\n6").plots[0].points;close(c[0].center,4);close(c[0].upper,10);close(c[0].lower,0);
const u=calculateControl("u","2,1\n8,4").plots[0].points;close(u[0].center,2);close(u[0].upper,2+3*Math.sqrt(2));close(u[1].upper,2+3*Math.sqrt(.5));
const imr=calculateControl("i-mr","1\n2\n4");close(imr.plots[0].points[0].center,7/3);close(imr.plots[1].points[0].center,1.5);assert.equal(imr.plots[1].points[0].index,2);assert.equal(imr.plots[1].points.length,2);
for(const mode of ["xbar-r","xbar-s","i-mr","p","np","c","u"] as const){const result=calculateControl(mode,controlExample(mode),mode==="xbar-s"?10:5);assert.ok(result.plots.every(plot=>plot.points.every(p=>Object.values(p).every(Number.isFinite))));}
const nist=calculateControl("p",controlExample("p")).plots[0].points;close(nist[0].center,nistFractions.reduce((s,x)=>s+x,0)/30);nist.forEach((p,i)=>close(p.value,nistFractions[i]));
for(const input of ["-1,10\n1,10","11,10\n1,10","1,0\n1,10","1,10,5\n1,10","1,\n1,10"]){assert.throws(()=>calculateControl("p",input));}
assert.throws(()=>calculateControl("c","2\nBAD\n3"));assert.throws(()=>calculateControl("u","2,0\n3,2"));assert.throws(()=>calculateControl("xbar-r","1,2,3,4,5,6",5));
assert.deepEqual(categoryFrequencies("A,5\nB,2\nA,7").map(r=>r.count),[12,2]);assert.throws(()=>categoryFrequencies("A,-1"));
const bins=distributionFrequencies("0,1,2,3,4,5,6,7,8,9,10",5);assert.equal(bins.reduce((s,r)=>s+r.count,0),11);assert.equal(bins[4].count,3);assert.equal(distributionFrequencies("4,4,4",5).reduce((s,r)=>s+r.count,0),3);
for(const count of [0,1,4,5,6,12,25]){const html=renderToStaticMarkup(<TallyMarks count={count}/>);assert.equal((html.match(/<line /g)||[]).length,count);assert.equal((html.match(/x1="1"/g)||[]).length,Math.floor(count/5));}
for(const rule of spcRules){const points=rule.example.map((value,i)=>({index:i+1,value,center:0,upper:3,lower:-3,standardError:1}));assert.ok(controlSignals(points,true).at(-1)?.includes(rule.id),rule.id);}
// Alternating directions entirely above CL still satisfy N4; alternating sides alone need not.
assert.ok(controlSignals(spcRules[3].example.map((value,i)=>({index:i+1,value,center:0,upper:3,lower:-3})),true).at(-1)?.includes("N4"));
assert.deepEqual(controlSignals([{index:1,value:3,center:0,upper:3,lower:-3}],false),[[]]);
assert.ok(spcReference.reduce((n,s)=>n+s.entries.length,0)>100);for(const section of spcReference)for(const entry of section.entries)assert.ok(entry.term&&entry.definition&&entry.formula&&entry.note,entry.term);
console.log(JSON.stringify({result:"PASS",checks:["7 control modes and hand-calculated limits","NIST 30-wafer values","unequal n weighting and per-point limits","reject invalid rows and incomplete subgroups","frequency bin boundaries and no lost maximum","12 tally strokes: two crossing five-bundles plus two singles","all 8 signal patterns including N4 direction","100+ complete glossary entries"]}));
