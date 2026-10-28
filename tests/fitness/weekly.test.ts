import {expect,it} from 'vitest';
import {summarize,type Data} from '../../shared/analytics';
import {seedPlan} from '../../shared/model';
const empty:Data={meals:[],workouts:[],weights:[],steps:[],supplements:[]};
it('distinguishes missing logs from zero and counts logged cardio sessions',()=>{
 const d:Data={...empty,steps:[{date:'2026-10-20',count:8000},{date:'2026-10-21',count:10000},{date:'2026-10-26',count:0},{date:'2026-10-27',count:6000}],workouts:[{date:'2026-10-26',ts:1,kind:'lift',label:'Push',intensity:'hard',exercises:[{name:'Curl',sets:[{w:20,r:10}]},{name:'curl',sets:[{w:30,r:8}]}]},{date:'2026-10-27',ts:2,kind:'cardio',label:'Walk',intensity:'easy',exercises:[]},{date:'2026-10-27',ts:3,kind:'cardio',label:'Run',intensity:'hard',exercises:[]}],supplements:[{date:'2026-10-26',items:['Creatine']},{date:'2026-10-26',items:['Creatine']}]};
 const w=summarize(d,seedPlan,'2026-10-28','week');
 expect(w.training).toMatchObject({exerciseCount:1,uniqueExercises:1,sets:2,cardioSessions:2,easyCardio:1,hardCardio:1});
 expect(w.stepsDetail).toMatchObject({total:6000,averageLoggedDay:3000,normalPrevious28Days:9000,baselineDays:2});
 expect(w.nutrition.caloriesPerLoggedDay).toBeNull();expect(w.supplementsDetail).toEqual([{name:'Creatine',days:1}]);
 expect(w.coverage.stepDays).toBe(2);expect(w.elapsedDays).toBe(3);
});
it('includes food macros and body check-ins only inside selected week',()=>{
 const meal={date:'2026-10-26',ts:1,name:'Meal',calories:600,protein:40,carbs:50,fat:20,quality:8,note:'',source:'estimate'};
 const w=summarize({...empty,meals:[meal,{...meal,calories:400}],measurements:[{date:'2026-10-26',arm:14,chest:40,shoulders:45,waist:32}],photos:[{date:'2026-10-25'},{date:'2026-10-28'}]},seedPlan,'2026-10-28','week');
 expect(w.nutrition.caloriesPerLoggedDay).toBe(1000);expect(w.coverage.mealDays).toBe(1);expect(w.checkIns).toMatchObject({measurements:1,photos:1,weightAverage:null});
});
it('chooses the latest timestamp when measurements are backfilled on the same day',()=>{
 const measurement={date:'2026-10-26',arm:14,chest:40,shoulders:45,waist:32};
 const w=summarize({...empty,measurements:[{...measurement,ts:200,arm:15},{...measurement,ts:100}]},seedPlan,'2026-10-28','week');
 expect(w.checkIns.latestMeasurements?.arm).toBe(15);
});
