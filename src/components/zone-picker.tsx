import { useState } from 'react';
import { PeruLocationPicker } from './peru-location-picker';
export function ZonePicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
 const [region,R]=useState(value.split(',').slice(-1)[0]?.trim()??'');
 return <PeruLocationPicker region={region} city={value.includes(',')?value.split(',')[0]?.trim()??'':''} onChange={(r,c)=>{R(r);onChange(c?`${c}, ${r}`:'');}}/>;
}
