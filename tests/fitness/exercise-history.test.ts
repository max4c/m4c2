import {expect,it} from 'vitest';
import {exerciseHistory} from '../../shared/exercise-history';
import {seedPlan,type Workout} from '../../shared/model';
it('combines repeated exercise rows into one session and counts volume once',()=>{
const workout:Workout={date:'2026-01-05',ts:1,kind:'lift',label:'Pull',intensity:'hard',exercises:[{name:'Incline DB curl',sets:[{w:20,r:10}]},{name:'incline db curl',sets:[{w:30,r:8}]}]};
const h=exerciseHistory([workout],'Incline DB curl',seedPlan);
expect(h.sessionCount).toBe(1);expect(h.setCount).toBe(2);expect(h.bestSession?.volume).toBe(440);expect(h.totalVolume).toBe(440);
});
it('does not call timed seconds lifting volume',()=>{const name=seedPlan.program.pull.find(e=>e.mode==='timed')?.name; if(!name) throw Error('Timed fixture required'); const h=exerciseHistory([{date:'2026-01-05',ts:1,kind:'lift',label:'Pull',intensity:'hard',exercises:[{name,sets:[{w:0,r:60}]}]}],name,seedPlan);expect(h.totalVolume).toBeNull();expect(h.bestSession).toBeNull();});
