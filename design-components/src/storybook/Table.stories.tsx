import React from 'react';
import Table from '../components/Table/Table';

export default {
  title: 'Components/HierarchyTable',
  component: Table,
};

const teamDataA = [
  {
    id: 1,
    name: 'John Mitchell',
    title: 'CRO',
    target: '$26.4M',
    forecast: '$20.4M',
    commit: '$18.1M',
    children: [
      {
        id: 2,
        name: 'Maria Thompson',
        title: 'VP Sales - Enterprise',
        target: '$18.5M',
        forecast: '$7.8M',
        commit: '$7.0M',
      },
      {
        id: 3,
        name: 'Robert Anderson',
        title: 'VP Sales - Mid-Market',
        target: '$6.5M',
        forecast: '$3.2M',
        commit: '$2.8M',
      },
    ],
  },
];

const teamDataB = [
  {
    id: 4,
    name: 'Alicia Garcia',
    title: 'VP Sales - North America',
    target: '$30.0M',
    forecast: '$24.0M',
    commit: '$20.0M',
    children: [
      {
        id: 5,
        name: 'Kevin Johnson',
        title: 'Regional Manager - West',
        target: '$12.0M',
        forecast: '$9.0M',
        commit: '$7.5M',
      },
      {
        id: 6,
        name: 'Emily Brown',
        title: 'Regional Manager - East',
        target: '$18.0M',
        forecast: '$15.0M',
        commit: '$12.5M',
      },
    ],
  },
];

const flatTeamData = [
  {
    id: 7,
    name: 'Daniel White',
    title: 'Account Manager',
    target: '$5.0M',
    forecast: '$4.0M',
    commit: '$3.5M',
  },
  {
    id: 8,
    name: 'Sophie Lee',
    title: 'Account Executive',
    target: '$3.0M',
    forecast: '$2.5M',
    commit: '$2.2M',
  },
];

export const Default = () => <Table data={teamDataA} />;

export const AnotherTeam = () => <Table data={teamDataB} />;

export const FlatTable = () => <Table data={flatTeamData} />;
