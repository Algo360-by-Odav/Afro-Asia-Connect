'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ServiceDetailContent from './ServiceDetailContent';

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ServiceDetailContent serviceId={id} />;
}
