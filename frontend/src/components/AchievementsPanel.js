import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { achievementsGet, achievementsUnlock } from '../services/api';
import toast from 'react-hot-toast';
import { playChimeShort } from '../services/audio';

const Panel = styled.div`
  width: 320px;
  padding: 1rem;
  background: rgba(255,255,255,0.96);
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadows.card};
`;

export default function AchievementsPanel({ userId='demo' }){
  const [data, setData] = useState({ achievements: [], points:0, streak:0 });

  const load = async ()=>{
    try{ const d = await achievementsGet(userId); setData(d); }catch(e){ console.error(e); }
  };

  useEffect(()=>{ load(); },[]);

  const unlock = async ()=>{
    try{
      const res = await achievementsUnlock({ userId, name: 'Master of Leftovers', description: 'Cooked 10 recipes from leftovers', points: 50 });
      if(res.ok){ playChimeShort(); toast.success('Unlocked: Master of Leftovers'); load(); }
    }catch(e){ toast.error('Could not unlock'); }
  };

  return (
    <Panel>
      <h3>Achievements</h3>
      <div>Points: {data.points || 0}</div>
      <div>Streak: {data.streak || 0} days</div>
      <div style={{marginTop:8}}>
        {data.achievements && data.achievements.length>0 ? (
          data.achievements.map((a, i)=> (
            <div key={i} style={{padding:8, borderRadius:8, background:'#fff', marginTop:6}}>
              <div style={{fontWeight:700}}>{a.name}</div>
              <div style={{fontSize:12, color:'#666'}}>{a.description}</div>
            </div>
          ))
        ) : (
          <div style={{color:'#718096'}}>No achievements yet. Keep cooking!</div>
        )}
      </div>
      <div style={{marginTop:12}}>
        <button onClick={unlock}>Force Unlock "Master of Leftovers"</button>
      </div>
    </Panel>
  );
}
