// Mock API for SWR
export const fetcher = (url: string) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === '/api/dashboard/stats') {
        resolve({
          progress: '85%',
          commission: '₩ 12.5M',
          activeListings: 24,
          newLeads: 156,
          progressTrend: '+12%',
          commissionTrend: '+5%',
          listingsTrend: '-2',
          leadsTrend: '+24%',
        });
      } else if (url === '/api/dashboard/activity') {
        resolve([
          {
            id: 1,
            address: '서울시 강남구 테헤란로 123 4층',
            timestamp: '2026-06-11 09:15:00',
            gpsCoords: '37.5001, 127.0364'
          },
          {
            id: 2,
            address: '서울시 서초구 서초대로 456 12층',
            timestamp: '2026-06-10 16:42:12',
            imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            gpsCoords: '37.491245, 127.008923'
          },
          {
            id: 3,
            address: '서울시 송파구 올림픽로 789 1층',
            timestamp: '2026-06-09 11:20:45',
            imageUrl: 'https://images.unsplash.com/photo-1572032473479-781e6e026197?auto=format&fit=crop&w=800&q=80',
            gpsCoords: '37.514321, 127.102345'
          }
        ]);
      } else if (url === '/api/settlements') {
        resolve({
          totalRevenue: 100,
          platformFee: 20,
          branchOverride: 10,
          divisionOverride: 10,
          teamOverride: 10,
          netEarnings: 50,
          status: 'complete'
        });
      } else {
        reject(new Error('Not found'));
      }
    }, 1000); // simulate 1s network delay to show loading skeletons
  });
};
