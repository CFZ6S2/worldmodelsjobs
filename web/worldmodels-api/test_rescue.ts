import { processLead } from './src/app/api/leads/route';

const mockLead = {
  category: 'trash',
  looksValuable: true,
  city: 'Multiple',
  rawText: 'I need 5 girls for Ibiza, April 30th - May 4th. Friendly girls who like to party. Milan, Dubai...',
  platform: 'whatsApp',
  title_es: 'Necesito modelos en varios destinos',
  remoteJid: '393478693117@s.whatsapp.net'
};

async function test() {
  console.log('Testing Rescue Logic...');
  const result = await processLead(mockLead);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test();
