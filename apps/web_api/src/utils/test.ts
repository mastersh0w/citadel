// Simple test to verify API structure
import { api } from './api';

export function testApiStructure() {
  console.log('Testing API structure...');
  
  // Test that all API methods exist
  const requiredMethods = [
    'antiNuke.getSettings',
    'moderation.getSettings', 
    'ranking.getSettings',
    'notifications.getSettings',
    'backup.getBackups',
    'quarantine.getUsers',
    'whitelist.getEntries',
    'audit.getLogs',
    'guild.getGuildInfo',
    'dashboard.getStatistics',
    'banner.getCurrentBanner'
  ];

  for (const method of requiredMethods) {
    const [namespace, methodName] = method.split('.');
    const apiNamespace = (api as any)[namespace];
    
    if (!apiNamespace || typeof apiNamespace[methodName] !== 'function') {
      console.error(`Missing API method: ${method}`);
      return false;
    }
  }
  
  console.log('✅ All API methods are available');
  return true;
}

// Test basic API call
export async function testApiCall() {
  try {
    console.log('Testing API call...');
    const response = await api.dashboard.getStatistics();
    
    if (response.success && response.data) {
      console.log('✅ API call successful');
      return true;
    } else {
      console.error('❌ API call failed:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ API call error:', error);
    return false;
  }
}