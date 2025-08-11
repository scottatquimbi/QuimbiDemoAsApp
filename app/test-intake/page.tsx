'use client';

import AutomatedIntakeForm from '@/app/components/AutomatedIntakeForm';

const mockPlayerProfile = {
  player_id: 'lannister-gold',
  player_name: 'LannisterGold',
  game_level: 27,
  vip_level: 12,
  is_spender: true,
  total_spend: 2187.00,
  session_days: 89,
  kingdom_id: 421,
  alliance_name: 'House Lannister'
};

export default function TestIntakePage() {
  const handleSubmit = (formData: any) => {
    console.log('✅ TEST: Form submitted!', formData);
    alert('Form submitted! Check console for details.');
  };

  const handleEscalate = (reason: string) => {
    console.log('🔄 TEST: Escalated!', reason);
    alert('Escalated: ' + reason);
  };

  return (
    <div>
      <div style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
        <h1>🧪 Direct Intake Form Test</h1>
        <p>This bypasses the AutomatedSupportFlow wrapper to test the form directly.</p>
      </div>
      
      <AutomatedIntakeForm
        playerProfile={mockPlayerProfile}
        onSubmit={handleSubmit}
        onEscalate={handleEscalate}
      />
    </div>
  );
}