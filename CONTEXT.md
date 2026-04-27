# M3pper

M3pper helps users create and edit spatial representations of interior or enclosed environments.

## Language

**Project**:
A saved workspace for one mapping effort.
_Avoid_: Document, file

**Map**:
The editable spatial representation inside a **Project**.
_Avoid_: Scene, model

**Object**:
An editable item placed in a **Map**.
_Avoid_: Node, item, element

**Shape**:
An **Object** that represents primitive geometry.
_Avoid_: Mesh, primitive

**Group**:
An **Object** that contains other **Objects**.
_Avoid_: Folder

## Relationships

- A **Project** is the top-level artifact a user creates, opens, saves, imports, or exports.
- A **Project** contains exactly one **Map**.
- A **Map** contains **Objects**.
- A **Group** contains zero or more **Objects**.
- A **Shape** is a visible geometric **Object**.

## Example dialogue

> **Dev:** "When a user opens M3pper, are they editing a document or a project?"
> **Domain expert:** "A **Project**. The file is just one way that project can be stored."
>
> **Dev:** "Can a project contain several maps?"
> **Domain expert:** "Not for the MVP. A **Project** contains one **Map**."
>
> **Dev:** "If a user selects three boxes and a label, what are they selecting?"
> **Domain expert:** "They are selecting **Objects**. The boxes are **Shapes** because they represent primitive geometry."

## Flagged ambiguities

- None yet.
