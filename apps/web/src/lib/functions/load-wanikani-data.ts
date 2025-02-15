/**
 * @license BSD-3-Clause
 * Copyright (c) 2025, ッツ Reader Authors
 * All rights reserved.
 */

import { wanikaniToken$ } from '$lib/data/store';

export let knownKanji: string = '';

interface SubjectData {
  id: number;
  object: 'subject';
  data: {
    slug: string;
  };
}

interface AssignmentResource {
  id: number;
  object: 'assignment';
  data: {
    subject_id: number;
    srs_stage: number;
  };
}

interface WaniKaniAssignmentResponse {
  object: 'collection';
  url: string;
  pages: {
    next_url: string | null;
    previous_url: string | null;
  };
  data: AssignmentResource[];
}

interface WaniKaniSubjectResponse {
  object: 'collection';
  url: string;
  pages: {
    next_url: string | null;
    previous_url: string | null;
  };
  data: SubjectData[];
}

export async function loadWanikaniData() {
  const headers = {
    Authorization: `Bearer ${wanikaniToken$.getValue()}`
  };

  const subject_ids: number[] = [];
  let nextUrl: string | null =
    `https://api.wanikani.com/v2/assignments?subject_types=kanji&srs_stages=5,6,7,8,9`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      console.warn(`WaniKani API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data: WaniKaniAssignmentResponse = await response.json();
    data.data.forEach((assignment) => {
      subject_ids.push(assignment.data.subject_id);
    });
    nextUrl = data.pages.next_url;
  }

  nextUrl = `https://api.wanikani.com/v2/subjects?ids=${subject_ids.join(',')}`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      console.warn(`WaniKani API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data: WaniKaniSubjectResponse = await response.json();
    data.data.forEach((subject) => {
      knownKanji += subject.data.slug;
    });
    nextUrl = data.pages.next_url;
  }
}
