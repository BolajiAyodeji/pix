import CombinedCourseParticipations from 'pix-orga/components/combined-course/participations';

<template>
  <CombinedCourseParticipations
    @participations={{@model}}
    @onFilter={{@controller.onFilter}}
    @selectedStatus={{@controller.statuses}}
  />
</template>
