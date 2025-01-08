export const normalizeNetworkOffer = (row: any) => {
  // Special handling for Suited - ACA
  if (row.network === 'Suited' && row.offer === 'ACA') {
    return {
      ...row,
      network: 'ACA',
      offer: 'ACA'
    };
  }
  return row;
}; 