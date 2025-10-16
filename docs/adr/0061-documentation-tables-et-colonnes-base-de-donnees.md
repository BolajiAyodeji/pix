# 61. Documentation tables, colonnes et migration de base de données

Date : 2025-10-15

## État

En cours de rédaction

## Contexte

La base de données actuelle contient des commentaires de description (par exemple dans les tables, colonnes, vues, etc.) rédigés dans deux langues : le français et l’anglais.
Étant donné que le projet Pix est open source et que sa vocation est de le rester, il est essentiel que la documentation et les métadonnées soient accessibles à la plus grande communauté possible, y compris aux contributeurs non francophones.

Aujourd’hui, cette mixité linguistique peut créer une barrière pour les contributeurs internationaux et nuit à la cohérence globale du code et de la documentation.

## Solution

Nous aimerions que tous les commentaires de description présents dans la base de données soient rédigés exclusivement en anglais.
Cela inclut notamment :

- les descriptions de tables et de colonnes.
- les fichiers de migration ou de définition du schéma contenant ces descriptions.

Les futures contributions au projet devront également respecter cette règle afin de garantir la cohérence linguistique dans le temps.

Cependant, les tables dites "privées" par exemple celles servant à l'équipe data, n'étant par définition pas ouverte, peuvent rester écrite en français pour des raisons de facilité de traduction de certaines notions.

## Conséquences

- Une phase de migration devra être réalisée pour traduire les commentaires existants du français vers l’anglais.
- Des règles de contribution (CONTRIBUTING.md) ou un linter de schéma pourront être mis en place pour éviter toute régression linguistique.
- Les relectures de code devront inclure la vérification de la langue des descriptions.
