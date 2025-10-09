import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaTrophy, FaFireAlt } from 'react-icons/fa';
import { achievementsGet, achievementsUnlock } from '../services/api';
import toast from 'react-hot-toast';
import { playChimeShort } from '../services/audio';

const Panel = styled(motion.div)`
  width: 320px;
  padding: 1rem;
  background: rgba(255,255,255,0.96);
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadows.card};
  border: 1px solid #f0f0f0;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.textDark};

  .icon { color: ${props => props.theme.colors.gold}; }
  h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const StatBubble = styled.div`
  background: #F7FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 0.6rem;
  text-align: center;
  color: #2D3748;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  .label { font-size: 0.75rem; color: #718096; font-weight: 600; }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
`;

const AchievementItem = styled(motion.div)`
  background: white;
  border-radius: 10px;
  border: 1px solid #eee;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: ${props => props.theme.transitions.fast};
  .name { font-weight: 800; color: ${props => props.theme.colors.textDark}; }
  .desc { font-size: 12px; color: #666; margin-top: 2px; }
`;

const EmptyState = styled.div`
  color: #718096;
  text-align: center;
  padding: 12px 0;
`;

const Actions = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: center;
`;

const UnlockButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1rem;
  font-weight: 700;
  cursor: pointer;
`;

export default function AchievementsPanel({ userId = 'demo' }) {
  const [data, setData] = useState({ achievements: [], points: 0, streak: 0 });

  const load = async () => {
    try { const d = await achievementsGet(userId); setData(d); } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const unlock = async () => {
    try {
      const res = await achievementsUnlock({ userId, name: 'Master of Leftovers', description: 'Cooked 10 recipes from leftovers', points: 50 });
      if (res.ok) { playChimeShort(); toast.success('Unlocked: Master of Leftovers'); load(); }
    } catch (e) { toast.error('Could not unlock'); }
  };

  return (
    <Panel initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <TitleBar>
        <FaTrophy className="icon" />
        <h3>Achievements</h3>
      </TitleBar>

      <StatsRow>
        <StatBubble>
          <div className="label">Points</div>
          <div>{data.points || 0}</div>
        </StatBubble>
        <StatBubble>
          <div className="label">Streak</div>
          <div><FaFireAlt style={{ color: '#F56565', marginRight: 6 }} />{data.streak || 0} days</div>
        </StatBubble>
      </StatsRow>

      <List>
        {data.achievements && data.achievements.length > 0 ? (
          data.achievements.map((a, i) => (
            <AchievementItem key={i} whileHover={{ scale: 1.02 }}>
              <div className="name">{a.name}</div>
              <div className="desc">{a.description}</div>
            </AchievementItem>
          ))
        ) : (
          <EmptyState>No achievements yet. Keep cooking!</EmptyState>
        )}
      </List>

      <Actions>
        <UnlockButton whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={unlock}>
          Force Unlock "Master of Leftovers"
        </UnlockButton>
      </Actions>
    </Panel>
  );
}
