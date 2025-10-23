import CombinedCourseHeader from 'pix-orga/components/combined-course/header';

<template>
  <CombinedCourseHeader
    @code={{@model.code}}
    @name={{@model.name}}
    @campaignIds={{@model.campaignIds}}
    @participationsCount={{@model.combinedCourseStatistics.participationsCount}}
    @completedParticipationsCount={{@model.combinedCourseStatistics.completedParticipationsCount}}
  />
  {{outlet}}
</template>
